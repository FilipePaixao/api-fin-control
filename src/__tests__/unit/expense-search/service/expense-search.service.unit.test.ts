import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseSearchService } from '../../../../domain/expense-search/service/expense-search.service';
import { IExpenseIndexRepository } from '../../../../domain/expense-search/interfaces/expense-index.repository';
import { IRagService } from '../../../../domain/rag/interfaces/rag.service.interface';
import {
  createExpenseRepositoryReadMock,
} from '../../helpers/service-mocks.helper';

function createExpenseIndexRepositoryMock(
  override: Partial<IExpenseIndexRepository> = {},
): IExpenseIndexRepository {
  return {
    ensureIndex: jest.fn(),
    recreateIndex: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
    ...override,
  };
}

function createRagServiceMock(override: Partial<IRagService> = {}): IRagService {
  return {
    syncUserFinancialContext: jest.fn(),
    syncExpense: jest.fn(),
    removeExpense: jest.fn(),
    searchExpenses: jest.fn(),
    askFinancialQuestion: jest.fn(),
    ...override,
  };
}

describe('When searching expenses with a text query', () => {
  it('Should merge lexical and semantic ids and hydrate expenses in ranking order', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      findExpensesByIds: jest.fn().mockResolvedValue([
        {
          id: 'expense-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 55,
          category: EExpenseCategory.SUBSCRIPTIONS,
          status: EExpenseStatus.PENDING,
          referenceMonth: '2026-06',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'expense-2',
          userId: 'user-1',
          name: 'Spotify',
          amount: 21,
          category: EExpenseCategory.SUBSCRIPTIONS,
          status: EExpenseStatus.PENDING,
          referenceMonth: '2026-06',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    });
    const expenseIndexRepository = createExpenseIndexRepositoryMock({
      search: jest.fn().mockResolvedValue(['expense-1', 'expense-2']),
    });
    const ragService = createRagServiceMock({
      searchExpenses: jest.fn().mockResolvedValue(['expense-2', 'expense-1']),
    });

    const service = new ExpenseSearchService({
      expenseRepositoryRead,
      expenseIndexRepository,
      ragService,
    });

    const result = await service.searchExpenses('user-1', {
      search: 'assinatura',
      referenceMonth: '2026-06',
    });

    expect(expenseIndexRepository.search).toHaveBeenCalledWith(
      'user-1',
      'assinatura',
      { referenceMonth: '2026-06', category: undefined, status: undefined },
      50,
    );
    expect(ragService.searchExpenses).toHaveBeenCalled();
    expect(expenseRepositoryRead.findExpensesByIds).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining(['expense-1', 'expense-2']),
    );
    expect(result.map((expense) => expense.id)).toEqual(
      expect.arrayContaining(['expense-1', 'expense-2']),
    );
  });
});

describe('When searching expenses without text', () => {
  it('Should delegate to repository listExpenses', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpenses: jest.fn().mockResolvedValue([]),
    });

    const service = new ExpenseSearchService({
      expenseRepositoryRead,
      expenseIndexRepository: createExpenseIndexRepositoryMock(),
      ragService: createRagServiceMock(),
    });

    await service.searchExpenses('user-1', { referenceMonth: '2026-06' });

    expect(expenseRepositoryRead.listExpenses).toHaveBeenCalledWith({
      userId: 'user-1',
      referenceMonth: '2026-06',
      category: undefined,
      status: undefined,
      from: undefined,
      to: undefined,
    });
  });
});
