import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { generateId } from '../../common/utils/generate-id';
import { ILlmProvider } from '../../agent/interfaces/llm-provider.interface';
import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';
import { EPaymentMethod } from '../../expense/entity/enums/EPaymentMethod';
import { IExpenseService } from '../../expense/interfaces/expense.service.interface';
import { ICreditCardService } from '../../credit-card/interfaces/credit-card.service.interface';
import { EIncomeCategory } from '../../income/entity/enums/EIncomeCategory';
import { EIncomeStatus } from '../../income/entity/enums/EIncomeStatus';
import { IIncomeService } from '../../income/interfaces/income.service.interface';
import {
  EImportDocumentType,
  EImportTransactionKind,
} from '../entity/enums/EImportDocumentType';
import {
  IAnalyzeImportResult,
  IConfirmImportInput,
  IConfirmImportResult,
  IImportedTransaction,
} from '../entity/interfaces/statement-import.interface';
import { IPdfTextExtractor } from '../interfaces/pdf-text-extractor.interface';
import { EXTRACT_TRANSACTIONS_TOOL } from '../tools/extract-transactions.tool';
import {
  ENRICH_MERCHANT_NAMES_SYSTEM_PROMPT,
  ENRICH_MERCHANT_NAMES_TOOL,
} from '../tools/enrich-merchant-names.tool';
import {
  chunkText,
  datesWithinOneDay,
  extractStructuredInvoiceLines,
  guessExpenseCategory,
  isInvoicePaymentDescription,
  looksLikePdf,
  namesLookSimilar,
  parseIsoDate,
  referenceMonthFromIsoDate,
} from '../utils/statement-import.utils';

const MAX_PDF_BYTES = 10 * 1024 * 1024;
/** Batches menores: qwen ~30s em 33 nomes; 40+ arrisca timeout/abort sob carga. */
const ENRICH_BATCH_SIZE = 10;

type RawExtractedTransaction = {
  kind?: string;
  name?: string;
  amount?: number;
  date?: string;
  category?: string;
  paymentMethod?: string;
  confidence?: number;
  suggestedSkip?: boolean;
};

export interface IParamsStatementImportService {
  pdfTextExtractor: IPdfTextExtractor;
  llmProvider: ILlmProvider;
  expenseService: IExpenseService;
  incomeService: IIncomeService;
  creditCardService: ICreditCardService;
  systemPrompt: string;
}

export class StatementImportService {
  private readonly pdfTextExtractor: IPdfTextExtractor;
  private readonly llmProvider: ILlmProvider;
  private readonly expenseService: IExpenseService;
  private readonly incomeService: IIncomeService;
  private readonly creditCardService: ICreditCardService;
  private readonly systemPrompt: string;

  constructor({
    pdfTextExtractor,
    llmProvider,
    expenseService,
    incomeService,
    creditCardService,
    systemPrompt,
  }: IParamsStatementImportService) {
    this.pdfTextExtractor = pdfTextExtractor;
    this.llmProvider = llmProvider;
    this.expenseService = expenseService;
    this.incomeService = incomeService;
    this.creditCardService = creditCardService;
    this.systemPrompt = systemPrompt;
  }

  async analyze(
    userId: string,
    input: {
      documentType: EImportDocumentType;
      fileBuffer: Buffer;
      mimeType?: string;
    },
  ): Promise<IAnalyzeImportResult> {
    this.assertValidPdf(input.fileBuffer, input.mimeType);

    let text: string;
    try {
      text = await this.pdfTextExtractor.extract(input.fileBuffer);
    } catch {
      throw {
        status: 400,
        errorCode: EErrorCode.IMPORT_INVALID_PDF,
        message: 'Failed to parse PDF',
      } as IThrowedError;
    }

    if (!text.trim()) {
      throw {
        status: 400,
        errorCode: EErrorCode.IMPORT_NO_TEXT,
        message: 'PDF has no extractable text',
      } as IThrowedError;
    }

    const [existingExpenses, existingIncomes] = await Promise.all([
      this.expenseService.listExpenses(userId, {}),
      this.incomeService.listIncomes(userId, {}),
    ]);

    const expenseHints = existingExpenses
      .slice(0, 20)
      .map((expense) => `${expense.name} → ${expense.category}`)
      .join('\n');
    const incomeHints = existingIncomes
      .slice(0, 10)
      .map((income) => `${income.name} → ${income.category}`)
      .join('\n');

    const rawTransactions: RawExtractedTransaction[] = [];
    const warnings: string[] = [];
    const normalizedText = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    // Faturas BR (ex. Nubank): parser determinístico — o LLM falhava em chunks de cabeçalho
    // e devolvia transactions:[]. Só cai no LLM se o parser não achar linhas.
    if (input.documentType === EImportDocumentType.INVOICE) {
      const structured = extractStructuredInvoiceLines(normalizedText);
      if (structured.length) {
        rawTransactions.push(
          ...structured.map((line) => ({
            kind: 'EXPENSE' as const,
            name: line.name,
            amount: line.amount,
            date: line.date,
            category: guessExpenseCategory(line.name),
            paymentMethod: 'CREDIT_CARD',
            suggestedSkip: line.suggestedSkip,
            confidence: 0.95,
          })),
        );
        warnings.push(
          `Extraídas ${structured.length} linhas pelo parser estruturado (sem LLM).`,
        );
      }
    }

    if (!rawTransactions.length) {
      for (const chunk of chunkText(normalizedText, 3500, 200)) {
        const extracted = await this.extractWithLlm({
          documentType: input.documentType,
          chunk,
          expenseHints,
          incomeHints,
        });
        rawTransactions.push(...extracted);
      }
    }

    if (!rawTransactions.length) {
      throw {
        status: 400,
        errorCode: EErrorCode.IMPORT_NO_TRANSACTIONS,
        message: 'No transactions extracted',
      } as IThrowedError;
    }

    const transactions = rawTransactions
      .map((raw) =>
        this.normalizeExtractedTransaction(raw, input.documentType, existingExpenses, existingIncomes),
      )
      .filter((item): item is IImportedTransaction => item !== null);

    if (!transactions.length) {
      throw {
        status: 400,
        errorCode: EErrorCode.IMPORT_NO_TRANSACTIONS,
        message: 'No valid transactions after normalization',
      } as IThrowedError;
    }

    const enriched = await this.enrichMerchantNames(transactions, warnings);

    return {
      documentType: input.documentType,
      transactions: enriched,
      warnings,
    };
  }

  async confirm(userId: string, input: IConfirmImportInput): Promise<IConfirmImportResult> {
    if (!Object.values(EImportDocumentType).includes(input.documentType)) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Invalid documentType',
      } as IThrowedError;
    }

    const selected = (input.transactions ?? []).filter((item) => item.selected !== false);
    if (!selected.length) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'No transactions selected',
      } as IThrowedError;
    }

    let invoiceCreditCardId: string | undefined;
    if (input.documentType === EImportDocumentType.INVOICE) {
      if (!input.creditCardId?.trim()) {
        throw {
          status: 400,
          errorCode: EErrorCode.FIELD_INVALID,
          message: 'creditCardId is required for INVOICE confirm',
        } as IThrowedError;
      }
      await this.creditCardService.getById(userId, input.creditCardId.trim());
      invoiceCreditCardId = input.creditCardId.trim();
    }

    const [existingExpenses, existingIncomes] = await Promise.all([
      this.expenseService.listExpenses(userId, {}),
      this.incomeService.listIncomes(userId, {}),
    ]);

    const expensePayloads = [];
    const incomePayloads = [];
    let skippedDuplicates = 0;

    for (const item of selected) {
      const date = parseIsoDate(item.date);
      if (!date || !item.name?.trim() || !(item.amount > 0)) {
        throw {
          status: 400,
          errorCode: EErrorCode.FIELD_INVALID,
          message: 'Invalid transaction in confirm payload',
        } as IThrowedError;
      }

      const name = item.name.trim();
      const isDuplicate =
        item.kind === EImportTransactionKind.EXPENSE
          ? this.isDuplicateExpense(name, item.amount, item.date, existingExpenses)
          : item.kind === EImportTransactionKind.INCOME
            ? this.isDuplicateIncome(name, item.amount, item.date, existingIncomes)
            : false;

      if (isDuplicate) {
        skippedDuplicates += 1;
        continue;
      }

      const referenceMonth =
        item.referenceMonth?.match(/^\d{4}-(0[1-9]|1[0-2])$/)
          ? item.referenceMonth
          : referenceMonthFromIsoDate(item.date);

      if (item.kind === EImportTransactionKind.EXPENSE) {
        const category = this.parseExpenseCategory(item.category);
        expensePayloads.push({
          userId,
          name,
          description: item.description?.trim() || undefined,
          amount: item.amount,
          category,
          paymentMethod:
            input.documentType === EImportDocumentType.INVOICE
              ? EPaymentMethod.CREDIT_CARD
              : this.parsePaymentMethod(item.paymentMethod),
          status: EExpenseStatus.PAID,
          dueDate: date,
          paidAt: date,
          referenceMonth,
          ...(invoiceCreditCardId ? { creditCardId: invoiceCreditCardId } : {}),
        });
      } else if (item.kind === EImportTransactionKind.INCOME) {
        const category = this.parseIncomeCategory(item.category);
        incomePayloads.push({
          userId,
          name,
          amount: item.amount,
          category,
          referenceMonth,
          receivedAt: date,
          status: EIncomeStatus.RECEIVED,
          source: 'statement-import',
        });
      } else {
        throw {
          status: 400,
          errorCode: EErrorCode.FIELD_INVALID,
          message: 'Invalid transaction kind',
        } as IThrowedError;
      }
    }

    if (!expensePayloads.length && !incomePayloads.length) {
      return { expenses: [], incomes: [], skippedDuplicates };
    }

    const expenses = await this.expenseService.createManyExpenses(userId, expensePayloads);
    let incomes: unknown[] = [];
    try {
      incomes = await this.incomeService.createManyIncomes(userId, incomePayloads);
    } catch (error) {
      await Promise.all(
        expenses.map((expense) =>
          this.expenseService.deleteExpenseById(userId, (expense as { id: string }).id),
        ),
      );
      throw error;
    }

    return { expenses, incomes, skippedDuplicates };
  }

  private assertValidPdf(buffer: Buffer, mimeType?: string): void {
    if (!buffer?.length || buffer.length > MAX_PDF_BYTES) {
      throw {
        status: 400,
        errorCode: EErrorCode.IMPORT_INVALID_PDF,
        message: 'PDF missing or too large',
      } as IThrowedError;
    }

    const normalized = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const mime = (mimeType ?? '').toLowerCase().trim();
    const mimeOk =
      !mime ||
      mime === 'application/pdf' ||
      mime === 'application/octet-stream' ||
      mime === 'application/x-pdf' ||
      mime.endsWith('/pdf');

    if (!mimeOk || !looksLikePdf(normalized)) {
      throw {
        status: 400,
        errorCode: EErrorCode.IMPORT_INVALID_PDF,
        message: `Not a PDF file (mime=${mime || 'n/a'} header=${normalized.subarray(0, 8).toString('utf8')})`,
      } as IThrowedError;
    }
  }

  private async extractWithLlm(input: {
    documentType: EImportDocumentType;
    chunk: string;
    expenseHints: string;
    incomeHints: string;
  }): Promise<RawExtractedTransaction[]> {
    try {
      const response = await this.llmProvider.chat({
        messages: [
          { role: 'system', content: this.systemPrompt },
          {
            role: 'user',
            content: [
              `documentType: ${input.documentType}`,
              'Dicas de categoria (despesas):',
              input.expenseHints || '(nenhuma)',
              'Dicas de categoria (entradas):',
              input.incomeHints || '(nenhuma)',
              'Texto do PDF:',
              input.chunk,
            ].join('\n'),
          },
        ],
        tools: [EXTRACT_TRANSACTIONS_TOOL],
      });

      const toolCall = response.message.toolCalls?.find(
        (call) => call.name === 'extract_transactions',
      );
      if (toolCall?.arguments) {
        const list = toolCall.arguments.transactions;
        if (Array.isArray(list)) {
          return list as RawExtractedTransaction[];
        }
      }

      const content = response.message.content?.trim();
      if (content) {
        const parsed = this.tryParseJsonTransactions(content);
        if (parsed.length) {
          return parsed;
        }
      }

      return [];
    } catch (error) {
      if ((error as IThrowedError)?.errorCode === EErrorCode.AGENT_LLM_UNAVAILABLE) {
        throw error;
      }
      throw {
        status: 503,
        errorCode: EErrorCode.AGENT_LLM_UNAVAILABLE,
        message: error instanceof Error ? error.message : 'LLM unavailable',
      } as IThrowedError;
    }
  }

  private tryParseJsonTransactions(content: string): RawExtractedTransaction[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [];
      }
      const parsed = JSON.parse(jsonMatch[0]) as { transactions?: unknown };
      return Array.isArray(parsed.transactions)
        ? (parsed.transactions as RawExtractedTransaction[])
        : [];
    } catch {
      return [];
    }
  }

  private normalizeExtractedTransaction(
    raw: RawExtractedTransaction,
    documentType: EImportDocumentType,
    existingExpenses: Array<{ name: string; amount: number; dueDate?: Date; paidAt?: Date }>,
    existingIncomes: Array<{ name: string; amount: number; receivedAt?: Date }>,
  ): IImportedTransaction | null {
    const name = raw.name?.trim();
    const amount = Number(raw.amount);
    const date = raw.date?.trim() ?? '';
    if (!name || !(amount > 0) || !parseIsoDate(date)) {
      return null;
    }

    let kind =
      raw.kind === 'INCOME'
        ? EImportTransactionKind.INCOME
        : EImportTransactionKind.EXPENSE;

    if (documentType === EImportDocumentType.INVOICE) {
      kind = EImportTransactionKind.EXPENSE;
    }

    const suggestedSkip =
      Boolean(raw.suggestedSkip) ||
      (documentType === EImportDocumentType.STATEMENT && isInvoicePaymentDescription(name));

    const category =
      kind === EImportTransactionKind.EXPENSE
        ? this.parseExpenseCategory(raw.category)
        : this.parseIncomeCategory(raw.category);

    const paymentMethod =
      kind === EImportTransactionKind.EXPENSE
        ? documentType === EImportDocumentType.INVOICE
          ? EPaymentMethod.CREDIT_CARD
          : this.parsePaymentMethod(raw.paymentMethod)
        : undefined;

    const duplicate =
      kind === EImportTransactionKind.EXPENSE
        ? this.isDuplicateExpense(name, amount, date, existingExpenses)
        : this.isDuplicateIncome(name, amount, date, existingIncomes);

    const selected = !suggestedSkip && !duplicate;

    return {
      tempId: generateId(),
      kind,
      name,
      originalName: name,
      description: '',
      amount,
      date,
      referenceMonth: referenceMonthFromIsoDate(date),
      category,
      paymentMethod,
      confidence:
        typeof raw.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1
          ? raw.confidence
          : undefined,
      suggestedSkip,
      duplicate,
      selected,
    };
  }

  private async enrichMerchantNames(
    transactions: IImportedTransaction[],
    warnings: string[],
  ): Promise<IImportedTransaction[]> {
    const uniqueNames = [
      ...new Set(
        transactions
          .map((item) => item.name.trim())
          .filter((name) => name.length > 0),
      ),
    ];
    if (!uniqueNames.length) {
      return transactions;
    }

    const displayByOriginal = new Map<string, string>();
    let batchFailures = 0;

    for (let start = 0; start < uniqueNames.length; start += ENRICH_BATCH_SIZE) {
      const batch = uniqueNames.slice(start, start + ENRICH_BATCH_SIZE);
      try {
        const batchMap = await this.enrichMerchantNamesBatch(batch);
        for (const [original, display] of batchMap) {
          displayByOriginal.set(original, display);
        }
      } catch {
        batchFailures += 1;
        for (const original of batch) {
          if (!displayByOriginal.has(original)) {
            displayByOriginal.set(original, this.fallbackMerchantDisplayName(original));
          }
        }
      }
    }

    if (batchFailures > 0) {
      warnings.push(
        batchFailures === Math.ceil(uniqueNames.length / ENRICH_BATCH_SIZE)
          ? 'Não foi possível enriquecer nomes com a IA; aplicados nomes limpos localmente.'
          : `Parte do enriquecimento pela IA falhou (${batchFailures} lote(s)); nomes limpos localmente nesses itens.`,
      );
    } else if (!displayByOriginal.size) {
      warnings.push(
        'Enriquecimento de nomes não retornou mapeamentos; mantidos os nomes originais.',
      );
      return transactions;
    }

    return transactions.map((item) => {
      const original = item.name.trim();
      const display = displayByOriginal.get(original)?.trim();
      if (!display || display === original) {
        return {
          ...item,
          originalName: original,
          description: item.description ?? '',
        };
      }
      return {
        ...item,
        originalName: original,
        name: display,
        description: item.description ?? '',
      };
    });
  }

  private async enrichMerchantNamesBatch(
    names: string[],
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const response = await this.llmProvider.chat({
      messages: [
        { role: 'system', content: ENRICH_MERCHANT_NAMES_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            'Normalize estes nomes de fatura/extrato:',
            ...names.map((name, index) => `${index + 1}. ${name}`),
          ].join('\n'),
        },
      ],
      tools: [ENRICH_MERCHANT_NAMES_TOOL],
    });

    const toolCall = response.message.toolCalls?.find(
      (call) => call.name === 'enrich_merchant_names',
    );
    const merchants = toolCall?.arguments?.merchants;
    if (Array.isArray(merchants)) {
      for (const entry of merchants) {
        if (
          entry &&
          typeof entry === 'object' &&
          typeof (entry as { original?: unknown }).original === 'string' &&
          typeof (entry as { displayName?: unknown }).displayName === 'string'
        ) {
          const original = (entry as { original: string }).original.trim();
          const displayName = (entry as { displayName: string }).displayName.trim();
          if (original && displayName) {
            result.set(original, displayName);
          }
        }
      }
    }

    // Also accept JSON in content as fallback
    if (!result.size && response.message.content?.trim()) {
      try {
        const jsonMatch = response.message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as {
            merchants?: Array<{ original?: string; displayName?: string }>;
          };
          for (const entry of parsed.merchants ?? []) {
            if (entry.original?.trim() && entry.displayName?.trim()) {
              result.set(entry.original.trim(), entry.displayName.trim());
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    for (const original of names) {
      if (!result.has(original)) {
        result.set(original, this.fallbackMerchantDisplayName(original));
      }
    }

    return result;
  }

  private fallbackMerchantDisplayName(original: string): string {
    let name = original.trim();
    name = name.replace(
      /^(MP\s*\*|Ifd\s*\*|IFD\s*\*|Ebn\s*\*|Pag\s*\*|Net\s+Pgt\s*\*|Vindi\s*\*|ASA\s*\*|Asa\s*\*)/i,
      '',
    );
    name = name.replace(/\s*-\s*Parcela\s+\d+\s*\/\s*\d+/i, '');
    name = name.replace(/\s{2,}/g, ' ').trim();
    return name || original.trim();
  }

  private isDuplicateExpense(
    name: string,
    amount: number,
    date: string,
    existingExpenses: Array<{ name: string; amount: number; dueDate?: Date; paidAt?: Date }>,
  ): boolean {
    return existingExpenses.some(
      (expense) =>
        expense.amount === amount &&
        namesLookSimilar(expense.name, name) &&
        (expense.dueDate || expense.paidAt) &&
        datesWithinOneDay(
          date,
          (expense.dueDate || expense.paidAt)!.toISOString().slice(0, 10),
        ),
    );
  }

  private isDuplicateIncome(
    name: string,
    amount: number,
    date: string,
    existingIncomes: Array<{ name: string; amount: number; receivedAt?: Date }>,
  ): boolean {
    return existingIncomes.some(
      (income) =>
        income.amount === amount &&
        namesLookSimilar(income.name, name) &&
        income.receivedAt &&
        datesWithinOneDay(date, income.receivedAt.toISOString().slice(0, 10)),
    );
  }

  private parseExpenseCategory(value: unknown): EExpenseCategory {
    return Object.values(EExpenseCategory).includes(value as EExpenseCategory)
      ? (value as EExpenseCategory)
      : EExpenseCategory.OTHER;
  }

  private parseIncomeCategory(value: unknown): EIncomeCategory {
    return Object.values(EIncomeCategory).includes(value as EIncomeCategory)
      ? (value as EIncomeCategory)
      : EIncomeCategory.OTHER;
  }

  private parsePaymentMethod(value: unknown): EPaymentMethod | undefined {
    return Object.values(EPaymentMethod).includes(value as EPaymentMethod)
      ? (value as EPaymentMethod)
      : undefined;
  }
}
