import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseService } from '../../../../domain/expense/service/expense.service';
import {
  createExpenseRepositoryReadMock,
  createExpenseRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When deleting expense by id from owner user', () => {
  it('Should delete the expense', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      findExpenseById: jest.fn().mockResolvedValue({
        id: 'expense-1',
        userId: 'user-1',
        name: 'Rent',
        amount: 1000,
        category: EExpenseCategory.HOUSING,
        status: EExpenseStatus.PENDING,
        referenceMonth: '2026-06',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock({
      deleteExpenseById: jest.fn().mockResolvedValue(null),
    });
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    await expenseService.deleteExpenseById('user-1', 'expense-1');

    expect(expenseRepositoryWrite.deleteExpenseById).toHaveBeenCalledWith('expense-1');
  });
});

describe('When deleting expense by id from another user', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      findExpenseById: jest.fn().mockResolvedValue({
        id: 'expense-1',
        userId: 'owner-user',
        name: 'Rent',
        amount: 1000,
        category: EExpenseCategory.HOUSING,
        status: EExpenseStatus.PENDING,
        referenceMonth: '2026-06',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock();
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    await expect(
      expenseService.deleteExpenseById('intruder-user', 'expense-1'),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { expenseId: 'expense-1' },
    });
  });
});
