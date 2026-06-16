import { ExpenseServiceFactory } from '../../../../configuration/factory/expense.service.factory';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseModel } from '../../../../infraestructure/db/mongo/models/expense.model';
import { createAuthenticatedUser } from '../../helpers/auth.helper';

const expenseService = ExpenseServiceFactory.create();

describe('When creating an expense through service with valid payload', () => {
  it('Should persist and return the expense', async () => {
    const { user } = await createAuthenticatedUser();

    const createdExpense = await expenseService.createExpense(user.id, {
      userId: 'ignored-user',
      name: 'Rent',
      amount: 1600,
      category: EExpenseCategory.HOUSING,
      referenceMonth: '2026-06',
    });

    const persistedExpense = await ExpenseModel.findOne({ id: createdExpense.id });

    expect(createdExpense).toMatchObject({
      userId: user.id,
      name: 'Rent',
      amount: 1600,
      category: EExpenseCategory.HOUSING,
      status: EExpenseStatus.PENDING,
    });
    expect(persistedExpense).not.toBeNull();
  });
});

describe('When creating an expense through service with invalid amount', () => {
  it('Should reject the payload', async () => {
    const { user } = await createAuthenticatedUser();

    await expect(
      expenseService.createExpense(user.id, {
        userId: 'ignored-user',
        name: 'Rent',
        amount: 0,
        category: EExpenseCategory.HOUSING,
        referenceMonth: '2026-06',
      }),
    ).rejects.toThrow('Expense amount must be greater than zero');
  });
});
