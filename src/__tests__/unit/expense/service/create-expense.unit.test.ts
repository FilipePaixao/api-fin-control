import { ExpenseService } from '../../../../domain/expense/service/expense.service';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
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
