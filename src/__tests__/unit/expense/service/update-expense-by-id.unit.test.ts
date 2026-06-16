import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseService } from '../../../../domain/expense/service/expense.service';
import {
  createExpenseRepositoryReadMock,
  createExpenseRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When updating expense by id from owner user', () => {
  it('Should return the updated expense', async () => {
    const now = new Date();
    const currentExpense = {
      id: 'expense-1',
      userId: 'user-1',
      name: 'Internet',
      amount: 120,
      category: EExpenseCategory.SUBSCRIPTIONS,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
      createdAt: now,
      updatedAt: now,
    };

    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      findExpenseById: jest.fn().mockResolvedValue(currentExpense),
    });
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock({
      updateExpenseById: jest.fn().mockResolvedValue({
        ...currentExpense,
        amount: 150,
        updatedAt: new Date(),
      }),
    });
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    const result = await expenseService.updateExpenseById('user-1', 'expense-1', {
      amount: 150,
    });

    expect(result).toMatchObject({ id: 'expense-1', amount: 150 });
  });
});

describe('When updating expense by id with invalid amount', () => {
  it('Should throw FIELD_INVALID', async () => {
    const now = new Date();
    const currentExpense = {
      id: 'expense-1',
      userId: 'user-1',
      name: 'Internet',
      amount: 120,
      category: EExpenseCategory.SUBSCRIPTIONS,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
      createdAt: now,
      updatedAt: now,
    };

    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      findExpenseById: jest.fn().mockResolvedValue(currentExpense),
    });
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock();
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    await expect(
      expenseService.updateExpenseById('user-1', 'expense-1', { amount: 0 }),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.FIELD_INVALID,
    });
  });
});
