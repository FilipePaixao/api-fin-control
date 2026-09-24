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

describe('When listing expenses with past due PENDING', () => {
  it('Should resolve status to OVERDUE', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpenses: jest.fn().mockResolvedValue([
        {
          id: 'expense-1',
          userId: 'user-1',
          name: 'Rent',
          amount: 1200,
          category: EExpenseCategory.HOUSING,
          status: EExpenseStatus.PENDING,
          dueDate: new Date('2020-01-01T12:00:00.000Z'),
          referenceMonth: '2026-06',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    });
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite: createExpenseRepositoryWriteMock(),
    });

    const result = await expenseService.listExpenses('user-1', {
      referenceMonth: '2026-06',
    });

    expect(result[0].status).toBe(EExpenseStatus.OVERDUE);
  });
});
