import { ExpenseService } from '../../../../domain/expense/service/expense.service';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import {
  createExpenseRepositoryReadMock,
  createExpenseRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When listing expenses with valid filters', () => {
  it('Should return expenses from repository', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpenses: jest.fn().mockResolvedValue([
        {
          id: 'expense-1',
          userId: 'user-1',
          name: 'Rent',
          amount: 1200,
          category: EExpenseCategory.HOUSING,
          status: EExpenseStatus.PENDING,
          referenceMonth: '2026-06',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    });
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock();
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    const result = await expenseService.listExpenses('user-1', {
      referenceMonth: '2026-06',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'expense-1', userId: 'user-1' });
  });
});

describe('When listing expenses and repository fails', () => {
  it('Should propagate the repository error', async () => {
    const repositoryError = new Error('database offline');
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpenses: jest.fn().mockRejectedValue(repositoryError),
    });
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock();
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    await expect(expenseService.listExpenses('user-1', {})).rejects.toBe(
      repositoryError,
    );
  });
});
