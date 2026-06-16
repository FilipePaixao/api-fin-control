import { EExpenseCategory } from '../../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseModel } from '../../../../../infraestructure/db/mongo/models/expense.model';
import { ExpenseRepositoryRead } from '../../../../../infraestructure/repository/expense/expense.repository.read';
import { createAuthenticatedUser } from '../../../helpers/auth.helper';

const repositoryRead = new ExpenseRepositoryRead();

describe('When listing expenses with matching filter', () => {
  it('Should return only user expenses', async () => {
    const owner = await createAuthenticatedUser();
    const anotherUser = await createAuthenticatedUser();

    await ExpenseModel.create({
      id: 'expense-list-1',
      userId: owner.user.id,
      name: 'Rent',
      amount: 1600,
      category: EExpenseCategory.HOUSING,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
    });
    await ExpenseModel.create({
      id: 'expense-list-2',
      userId: anotherUser.user.id,
      name: 'Gym',
      amount: 120,
      category: EExpenseCategory.HEALTH,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
    });

    const result = await repositoryRead.listExpenses({
      userId: owner.user.id,
      referenceMonth: '2026-06',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ userId: owner.user.id, name: 'Rent' });
  });
});

describe('When listing expenses with no matching filter', () => {
  it('Should return empty array', async () => {
    const owner = await createAuthenticatedUser();
    const result = await repositoryRead.listExpenses({
      userId: owner.user.id,
      referenceMonth: '2099-12',
    });

    expect(result).toEqual([]);
  });
});
