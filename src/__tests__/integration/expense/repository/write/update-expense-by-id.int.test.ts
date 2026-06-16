import { EExpenseCategory } from '../../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseModel } from '../../../../../infraestructure/db/mongo/models/expense.model';
import { ExpenseRepositoryWrite } from '../../../../../infraestructure/repository/expense/expense.repository.write';
import { createAuthenticatedUser } from '../../../helpers/auth.helper';

const repositoryWrite = new ExpenseRepositoryWrite();

describe('When updating expense by id that exists', () => {
  it('Should return the updated expense', async () => {
    const { user } = await createAuthenticatedUser();
    await ExpenseModel.create({
      id: 'expense-update-1',
      userId: user.id,
      name: 'Transport',
      amount: 90,
      category: EExpenseCategory.TRANSPORT,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
    });

    const result = await repositoryWrite.updateExpenseById('expense-update-1', {
      amount: 110,
    });

    expect(result).toMatchObject({ id: 'expense-update-1', amount: 110 });
  });
});

describe('When updating expense by id that does not exist', () => {
  it('Should return null', async () => {
    const result = await repositoryWrite.updateExpenseById('nonexistent-expense', {
      amount: 110,
    });

    expect(result).toBeNull();
  });
});
