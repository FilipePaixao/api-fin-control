import { StatementImportService } from '../../../../domain/statement-import/service/statement-import.service';
import {
  EImportDocumentType,
  EImportTransactionKind,
} from '../../../../domain/statement-import/entity/enums/EImportDocumentType';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { EPaymentMethod } from '../../../../domain/expense/entity/enums/EPaymentMethod';
import { EIncomeCategory } from '../../../../domain/income/entity/enums/EIncomeCategory';
import { ILlmProvider } from '../../../../domain/agent/interfaces/llm-provider.interface';
import { IExpenseService } from '../../../../domain/expense/interfaces/expense.service.interface';
import { IIncomeService } from '../../../../domain/income/interfaces/income.service.interface';
import { ICreditCardService } from '../../../../domain/credit-card/interfaces/credit-card.service.interface';
import { IPdfTextExtractor } from '../../../../domain/statement-import/interfaces/pdf-text-extractor.interface';

function createPdfExtractor(text: string): IPdfTextExtractor {
  return {
    extract: jest.fn().mockResolvedValue(text),
  };
}

function createLlm(
  transactions: unknown[],
  enrichMap: Record<string, string> = {},
): ILlmProvider {
  return {
    chat: jest.fn().mockImplementation(async (request: { tools?: Array<{ name: string }> }) => {
      const toolNames = (request.tools ?? []).map((tool) => tool.name);
      if (toolNames.includes('enrich_merchant_names')) {
        return {
          done: true,
          message: {
            role: 'assistant',
            content: '',
            toolCalls: [
              {
                name: 'enrich_merchant_names',
                arguments: {
                  merchants: Object.entries(enrichMap).map(([original, displayName]) => ({
                    original,
                    displayName,
                  })),
                },
              },
            ],
          },
        };
      }

      return {
        done: true,
        message: {
          role: 'assistant',
          content: '',
          toolCalls: [
            {
              name: 'extract_transactions',
              arguments: { transactions },
            },
          ],
        },
      };
    }),
  };
}

function createExpenseService(
  override: Partial<IExpenseService> = {},
): IExpenseService {
  return {
    createExpense: jest.fn(),
    createManyExpenses: jest.fn().mockResolvedValue([]),
    listExpenses: jest.fn().mockResolvedValue([]),
    getExpenseById: jest.fn(),
    updateExpenseById: jest.fn(),
    deleteExpenseById: jest.fn(),
    payExpenseById: jest.fn(),
    createInstallmentExpenses: jest.fn(),
    deleteInstallmentGroup: jest.fn(),
    ...override,
  };
}

function createIncomeService(override: Partial<IIncomeService> = {}): IIncomeService {
  return {
    createIncome: jest.fn(),
    createManyIncomes: jest.fn().mockResolvedValue([]),
    listIncomes: jest.fn().mockResolvedValue([]),
    getIncomeById: jest.fn(),
    updateIncomeById: jest.fn(),
    deleteIncomeById: jest.fn(),
    receiveIncomeById: jest.fn(),
    ...override,
  };
}

function createCreditCardService(
  override: Partial<ICreditCardService> = {},
): ICreditCardService {
  return {
    create: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue({
      id: 'card-1',
      userId: 'user-1',
      name: 'Nubank',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: jest.fn(),
    delete: jest.fn(),
    ...override,
  };
}

function buildService(params: {
  text?: string;
  transactions?: unknown[];
  enrichMap?: Record<string, string>;
  expenseService?: IExpenseService;
  incomeService?: IIncomeService;
  creditCardService?: ICreditCardService;
  llm?: ILlmProvider;
  pdfFails?: boolean;
}) {
  const pdfTextExtractor = params.pdfFails
    ? { extract: jest.fn().mockRejectedValue(new Error('bad pdf')) }
    : createPdfExtractor(params.text ?? 'Supermercado 50,00');

  return new StatementImportService({
    pdfTextExtractor,
    llmProvider:
      params.llm ??
      createLlm(
        params.transactions ?? [
          {
            kind: 'EXPENSE',
            name: 'Supermercado',
            amount: 50,
            date: '2026-09-10',
            category: 'FOOD',
            paymentMethod: 'CREDIT_CARD',
            confidence: 0.9,
          },
        ],
        params.enrichMap,
      ),
    expenseService: params.expenseService ?? createExpenseService(),
    incomeService: params.incomeService ?? createIncomeService(),
    creditCardService: params.creditCardService ?? createCreditCardService(),
    systemPrompt: 'test-prompt',
  });
}

const pdfHeader = Buffer.from('%PDF-1.4 fake content for tests');

describe('StatementImportService.analyze', () => {
  it('extrai fatura Nubank via parser estruturado e enriquece nomes', async () => {
    const llm = createLlm([]);
    const service = buildService({
      llm,
      text: `FATURA 28 SET 2026
TRANSAÇÕES DE 21 AGO A 21 SET
21 AGO •••• 0506 Rcar Transportes - Parcela 3/3 R$ 238,66
22 AGO •••• 7353 Supermercados Tozetto R$ 19,58
21 AGO Pagamento em 21 AGO −R$ 3.823,59
`,
    });

    const result = await service.analyze('user-1', {
      documentType: EImportDocumentType.INVOICE,
      fileBuffer: pdfHeader,
      mimeType: 'application/pdf',
    });

    expect(llm.chat).toHaveBeenCalled();
    expect(result.transactions.length).toBeGreaterThanOrEqual(2);
    expect(result.transactions.every((t) => t.paymentMethod === EPaymentMethod.CREDIT_CARD)).toBe(
      true,
    );
    const payment = result.transactions.find((t) => /pagamento/i.test(t.name));
    expect(payment?.suggestedSkip).toBe(true);
  });

  it('TC-01: analyzes invoice into CREDIT_CARD expenses without persisting', async () => {
    const expenseService = createExpenseService();
    const incomeService = createIncomeService();
    const service = buildService({
      expenseService,
      incomeService,
      transactions: [
        {
          kind: 'EXPENSE',
          name: 'Supermercado',
          amount: 50,
          date: '2026-09-10',
          category: 'FOOD',
          paymentMethod: 'PIX',
          confidence: 0.9,
        },
      ],
    });

    const result = await service.analyze('user-1', {
      documentType: EImportDocumentType.INVOICE,
      fileBuffer: pdfHeader,
      mimeType: 'application/pdf',
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toMatchObject({
      kind: EImportTransactionKind.EXPENSE,
      name: 'Supermercado',
      amount: 50,
      category: EExpenseCategory.FOOD,
      paymentMethod: EPaymentMethod.CREDIT_CARD,
      selected: true,
    });
    expect(expenseService.createManyExpenses).not.toHaveBeenCalled();
    expect(incomeService.createManyIncomes).not.toHaveBeenCalled();
  });

  it('forces CREDIT_CARD on confirm for invoice even if payload says otherwise', async () => {
    const expenseService = createExpenseService({
      createManyExpenses: jest.fn().mockImplementation(
        async (_userId: string, payloads: Array<Record<string, unknown>>) =>
          payloads.map((payload, index: number) => ({
            id: `exp-${index}`,
            ...payload,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
      ),
    });
    const service = buildService({ expenseService });

    await service.confirm('user-1', {
      documentType: EImportDocumentType.INVOICE,
      creditCardId: 'card-1',
      transactions: [
        {
          kind: EImportTransactionKind.EXPENSE,
          name: 'Netflix',
          amount: 39.9,
          date: '2026-09-01',
          referenceMonth: '2026-09',
          category: EExpenseCategory.SUBSCRIPTIONS,
          paymentMethod: EPaymentMethod.PIX,
          selected: true,
        },
      ],
    });

    expect(expenseService.createManyExpenses).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Netflix',
          paymentMethod: EPaymentMethod.CREDIT_CARD,
          creditCardId: 'card-1',
        }),
      ]),
    );
  });

  it('enriches generic merchant names via LLM and keeps originalName', async () => {
    const service = buildService({
      enrichMap: {
        'MP *Betelbarbeari': 'Betel Barbearia',
        'Supermercados Tozetto': 'Supermercados Tozetto',
      },
      text: `FATURA 28 SET 2026
21 AGO •••• 7353 MP *Betelbarbeari R$ 175,00
22 AGO •••• 7353 Supermercados Tozetto R$ 19,58
`,
    });

    const result = await service.analyze('user-1', {
      documentType: EImportDocumentType.INVOICE,
      fileBuffer: pdfHeader,
      mimeType: 'application/pdf',
    });

    const betel = result.transactions.find((t) => t.originalName === 'MP *Betelbarbeari');
    expect(betel).toMatchObject({
      name: 'Betel Barbearia',
      originalName: 'MP *Betelbarbeari',
    });
  });

  it('keeps original names when enrich LLM fails', async () => {
    const llm: ILlmProvider = {
      chat: jest.fn().mockImplementation(async (request: { tools?: Array<{ name: string }> }) => {
        const toolNames = (request.tools ?? []).map((tool) => tool.name);
        if (toolNames.includes('enrich_merchant_names')) {
          throw {
            status: 503,
            errorCode: EErrorCode.AGENT_LLM_UNAVAILABLE,
            message: 'down',
          };
        }
        return {
          done: true,
          message: { role: 'assistant', content: '', toolCalls: [] },
        };
      }),
    };
    const service = buildService({
      llm,
      text: `FATURA 28 SET 2026
21 AGO •••• 7353 MP *Betelbarbeari R$ 175,00
`,
    });

    const result = await service.analyze('user-1', {
      documentType: EImportDocumentType.INVOICE,
      fileBuffer: pdfHeader,
      mimeType: 'application/pdf',
    });

    expect(result.transactions[0].name).toBe('Betelbarbeari');
    expect(result.warnings.some((w) => /enriquecer nomes|enriquecimento/i.test(w))).toBe(true);
  });

  it('persists description on confirm expense payload', async () => {
    const expenseService = createExpenseService({
      createManyExpenses: jest.fn().mockResolvedValue([]),
    });
    const service = buildService({ expenseService });

    await service.confirm('user-1', {
      documentType: EImportDocumentType.INVOICE,
      creditCardId: 'card-1',
      transactions: [
        {
          kind: EImportTransactionKind.EXPENSE,
          name: 'Betel Barbearia',
          description: 'Corte + barba',
          amount: 175,
          date: '2026-08-28',
          referenceMonth: '2026-09',
          category: EExpenseCategory.OTHER,
          selected: true,
        },
      ],
    });

    expect(expenseService.createManyExpenses).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Betel Barbearia',
          description: 'Corte + barba',
        }),
      ]),
    );
  });

  it('TC-05: rejects INVOICE confirm without creditCardId', async () => {
    const expenseService = createExpenseService();
    const service = buildService({ expenseService });

    await expect(
      service.confirm('user-1', {
        documentType: EImportDocumentType.INVOICE,
        transactions: [
          {
            kind: EImportTransactionKind.EXPENSE,
            name: 'Netflix',
            amount: 39.9,
            date: '2026-09-01',
            referenceMonth: '2026-09',
            category: EExpenseCategory.SUBSCRIPTIONS,
            selected: true,
          },
        ],
      }),
    ).rejects.toMatchObject({ errorCode: EErrorCode.FIELD_INVALID });

    expect(expenseService.createManyExpenses).not.toHaveBeenCalled();
  });

  it('skips duplicate expenses on confirm and reports skippedDuplicates', async () => {
    const expenseService = createExpenseService({
      listExpenses: jest.fn().mockResolvedValue([
        {
          id: 'e1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 39.9,
          category: EExpenseCategory.SUBSCRIPTIONS,
          status: EExpenseStatus.PAID,
          referenceMonth: '2026-09',
          dueDate: new Date('2026-09-01T12:00:00.000Z'),
          paidAt: new Date('2026-09-01T12:00:00.000Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      createManyExpenses: jest.fn().mockResolvedValue([]),
    });
    const service = buildService({ expenseService });

    const result = await service.confirm('user-1', {
      documentType: EImportDocumentType.INVOICE,
      creditCardId: 'card-1',
      transactions: [
        {
          kind: EImportTransactionKind.EXPENSE,
          name: 'Netflix',
          amount: 39.9,
          date: '2026-09-01',
          referenceMonth: '2026-09',
          category: EExpenseCategory.SUBSCRIPTIONS,
          selected: true,
        },
      ],
    });

    expect(result.skippedDuplicates).toBe(1);
    expect(result.expenses).toEqual([]);
    expect(expenseService.createManyExpenses).not.toHaveBeenCalled();
  });

  it('rolls back expenses when income create fails', async () => {
    const createdExpenses = [
      {
        id: 'exp-1',
        userId: 'user-1',
        name: 'Uber',
        amount: 20,
      },
    ];
    const expenseService = createExpenseService({
      createManyExpenses: jest.fn().mockResolvedValue(createdExpenses),
      deleteExpenseById: jest.fn().mockResolvedValue(undefined),
    });
    const incomeService = createIncomeService({
      createManyIncomes: jest.fn().mockRejectedValue(new Error('income failed')),
    });
    const service = buildService({ expenseService, incomeService });

    await expect(
      service.confirm('user-1', {
        documentType: EImportDocumentType.STATEMENT,
        transactions: [
          {
            kind: EImportTransactionKind.EXPENSE,
            name: 'Uber',
            amount: 20,
            date: '2026-09-01',
            referenceMonth: '2026-09',
            category: EExpenseCategory.TRANSPORT,
            selected: true,
          },
          {
            kind: EImportTransactionKind.INCOME,
            name: 'Salario',
            amount: 5000,
            date: '2026-09-05',
            referenceMonth: '2026-09',
            category: EIncomeCategory.SALARY,
            selected: true,
          },
        ],
      }),
    ).rejects.toThrow('income failed');

    expect(expenseService.deleteExpenseById).toHaveBeenCalledWith('user-1', 'exp-1');
  });

  it('TC-02: throws IMPORT_NO_TEXT when PDF has no text', async () => {
    const llm = createLlm([]);
    const service = buildService({ text: '   ', llm });

    await expect(
      service.analyze('user-1', {
        documentType: EImportDocumentType.STATEMENT,
        fileBuffer: pdfHeader,
        mimeType: 'application/pdf',
      }),
    ).rejects.toMatchObject({ errorCode: EErrorCode.IMPORT_NO_TEXT });

    expect(llm.chat).not.toHaveBeenCalled();
  });

  it('TC-03: marks invoice payment lines as suggestedSkip', async () => {
    const service = buildService({
      transactions: [
        {
          kind: 'EXPENSE',
          name: 'Pagamento fatura cartao',
          amount: 1200,
          date: '2026-09-05',
          category: 'DEBT',
        },
      ],
    });

    const result = await service.analyze('user-1', {
      documentType: EImportDocumentType.STATEMENT,
      fileBuffer: pdfHeader,
      mimeType: 'application/pdf',
    });

    expect(result.transactions[0].suggestedSkip).toBe(true);
    expect(result.transactions[0].selected).toBe(false);
  });

  it('TC-04: marks duplicate expenses', async () => {
    const expenseService = createExpenseService({
      listExpenses: jest.fn().mockResolvedValue([
        {
          id: 'e1',
          userId: 'user-1',
          name: 'Uber Trip',
          amount: 32.5,
          category: EExpenseCategory.TRANSPORT,
          status: EExpenseStatus.PAID,
          referenceMonth: '2026-09',
          dueDate: new Date('2026-09-10T12:00:00.000Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    });

    const service = buildService({
      expenseService,
      transactions: [
        {
          kind: 'EXPENSE',
          name: 'Uber Trip',
          amount: 32.5,
          date: '2026-09-10',
          category: 'TRANSPORT',
        },
      ],
    });

    const result = await service.analyze('user-1', {
      documentType: EImportDocumentType.STATEMENT,
      fileBuffer: pdfHeader,
      mimeType: 'application/pdf',
    });

    expect(result.transactions[0].duplicate).toBe(true);
    expect(result.transactions[0].selected).toBe(false);
  });

  it('TC-07: maps LLM failures to AGENT_LLM_UNAVAILABLE', async () => {
    const llm: ILlmProvider = {
      chat: jest.fn().mockRejectedValue(new Error('connection refused')),
    };
    const service = buildService({ llm });

    await expect(
      service.analyze('user-1', {
        documentType: EImportDocumentType.INVOICE,
        fileBuffer: pdfHeader,
        mimeType: 'application/pdf',
      }),
    ).rejects.toMatchObject({ errorCode: EErrorCode.AGENT_LLM_UNAVAILABLE });
  });
});

describe('StatementImportService.confirm', () => {
  it('TC-05: creates only selected transactions', async () => {
    const expenseService = createExpenseService({
      createManyExpenses: jest.fn().mockImplementation(
        async (_userId: string, payloads: Array<Record<string, unknown>>) =>
          payloads.map((payload, index: number) => ({
            id: `exp-${index}`,
            ...payload,
            status: EExpenseStatus.PAID,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
      ),
    });
    const incomeService = createIncomeService({
      createManyIncomes: jest.fn().mockImplementation(
        async (_userId: string, payloads: Array<Record<string, unknown>>) =>
          payloads.map((payload, index: number) => ({
            id: `inc-${index}`,
            ...payload,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
      ),
    });
    const service = buildService({ expenseService, incomeService });

    const result = await service.confirm('user-1', {
      documentType: EImportDocumentType.STATEMENT,
      transactions: [
        {
          kind: EImportTransactionKind.EXPENSE,
          name: 'Padaria',
          amount: 20,
          date: '2026-09-01',
          referenceMonth: '2026-09',
          category: EExpenseCategory.FOOD,
          selected: true,
        },
        {
          kind: EImportTransactionKind.INCOME,
          name: 'Salario',
          amount: 5000,
          date: '2026-09-05',
          referenceMonth: '2026-09',
          category: EIncomeCategory.SALARY,
          selected: true,
        },
        {
          kind: EImportTransactionKind.EXPENSE,
          name: 'Skip me',
          amount: 10,
          date: '2026-09-02',
          referenceMonth: '2026-09',
          category: EExpenseCategory.OTHER,
          selected: false,
        },
      ],
    });

    expect(expenseService.createManyExpenses).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({ name: 'Padaria', amount: 20 }),
      ]),
    );
    expect(incomeService.createManyIncomes).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({ name: 'Salario', amount: 5000 }),
      ]),
    );
    expect(result.expenses).toHaveLength(1);
    expect(result.incomes).toHaveLength(1);
  });
});
