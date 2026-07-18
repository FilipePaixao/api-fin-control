import { ExpenseService } from '../../../../domain/expense/service/expense.service';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import {
  createExpenseRepositoryReadMock,
  createExpenseRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When creating installment expenses', () => {
  it('Should create all installments with shared group id', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock();
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock({
      createManyExpenses: jest.fn().mockImplementation(async (expenses) => expenses),
    });
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    const result = await expenseService.createInstallmentExpenses('user-1', {
      userId: 'user-1',
      name: 'Notebook',
      totalAmount: 6000,
      totalInstallments: 12,
      category: EExpenseCategory.DEBT,
      referenceMonth: '2026-01',
    });

    expect(result).toHaveLength(12);
    expect(result[0].installmentGroupId).toBe(result[11].installmentGroupId);
    expect(result[0].installmentNumber).toBe(1);
    expect(result[11].installmentNumber).toBe(12);
    expect(result.reduce((sum, expense) => sum + expense.amount, 0)).toBe(6000);
    expect(expenseRepositoryWrite.createManyExpenses).toHaveBeenCalledTimes(1);
  });
});

describe('When deleting installment group', () => {
  it('Should delete all expenses in the group', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpensesByInstallmentGroupId: jest.fn().mockResolvedValue([
        { id: 'exp-1', userId: 'user-1' },
        { id: 'exp-2', userId: 'user-1' },
      ]),
    });
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock({
      deleteExpensesByIds: jest.fn().mockResolvedValue(2),
    });
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    await expenseService.deleteInstallmentGroup('user-1', 'group-1');

    expect(expenseRepositoryWrite.deleteExpensesByIds).toHaveBeenCalledWith([
      'exp-1',
      'exp-2',
    ]);
  });
});
