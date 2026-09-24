import { ExpenseService } from '../../../../domain/expense/service/expense.service';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import {
  createExpenseRepositoryReadMock,
  createExpenseRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When creating an expense with valid payload', () => {
  it('Should create the expense using the authenticated user id', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock();
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock({
      createExpense: jest.fn().mockImplementation(async (expense) => expense),
    });
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    const result = await expenseService.createExpense('user-1', {
      userId: 'ignored-user',
      name: 'Internet',
      amount: 120,
      category: EExpenseCategory.SUBSCRIPTIONS,
      referenceMonth: '2026-06',
    });

    expect(result.userId).toBe('user-1');
    expect(result.status).toBe(EExpenseStatus.PENDING);
  });

  it('Should reject unknown creditCardId', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock();
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock();
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
      creditCardRepositoryRead: {
        findById: jest.fn().mockResolvedValue(null),
        listByUserId: jest.fn().mockResolvedValue([]),
      },
    });

    await expect(
      expenseService.createExpense('user-1', {
        userId: 'user-1',
        name: 'Internet',
        amount: 120,
        category: EExpenseCategory.SUBSCRIPTIONS,
        referenceMonth: '2026-06',
        creditCardId: 'missing-card',
      }),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
    });
  });
});

describe('When creating an expense with invalid payload', () => {
  it('Should throw validation error', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock();
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock();
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    await expect(
      expenseService.createExpense('user-1', {
        userId: 'ignored-user',
        name: 'Invalid',
        amount: 0,
        category: EExpenseCategory.SUBSCRIPTIONS,
        referenceMonth: '2026-06',
      }),
    ).rejects.toThrow('Expense amount must be greater than zero');
  });
});
