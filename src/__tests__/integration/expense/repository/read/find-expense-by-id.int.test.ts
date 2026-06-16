import { EExpenseCategory } from '../../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseModel } from '../../../../../infraestructure/db/mongo/models/expense.model';
import { ExpenseRepositoryRead } from '../../../../../infraestructure/repository/expense/expense.repository.read';
import { createAuthenticatedUser } from '../../../helpers/auth.helper';

const repositoryRead = new ExpenseRepositoryRead();

describe('When finding expense by id that exists', () => {
  it('Should return the expense', async () => {
    const { user } = await createAuthenticatedUser();
    const createdExpense = await ExpenseModel.create({
      id: 'expense-find-1',
      userId: user.id,
      name: 'Internet',
      amount: 130,
      category: EExpenseCategory.SUBSCRIPTIONS,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
    });

    const result = await repositoryRead.findExpenseById(createdExpense.id);

    expect(result).toMatchObject({
      id: createdExpense.id,
      userId: user.id,
      name: 'Internet',
    });
  });
});

describe('When finding expense by id that does not exist', () => {
  it('Should return null', async () => {
    const result = await repositoryRead.findExpenseById('nonexistent-expense');
    expect(result).toBeNull();
  });
});
