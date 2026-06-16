import { EExpenseCategory } from '../../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseModel } from '../../../../../infraestructure/db/mongo/models/expense.model';
import { ExpenseRepositoryWrite } from '../../../../../infraestructure/repository/expense/expense.repository.write';
import { createAuthenticatedUser } from '../../../helpers/auth.helper';

const repositoryWrite = new ExpenseRepositoryWrite();

describe('When deleting expense by id that exists', () => {
  it('Should return the deleted expense', async () => {
    const { user } = await createAuthenticatedUser();
    await ExpenseModel.create({
      id: 'expense-delete-1',
      userId: user.id,
      name: 'Subscription',
      amount: 59,
      category: EExpenseCategory.SUBSCRIPTIONS,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
    });

    const result = await repositoryWrite.deleteExpenseById('expense-delete-1');

    expect(result).toMatchObject({ id: 'expense-delete-1' });
  });
});

describe('When deleting expense by id that does not exist', () => {
  it('Should return null', async () => {
    const result = await repositoryWrite.deleteExpenseById('nonexistent-expense');
    expect(result).toBeNull();
  });
});
