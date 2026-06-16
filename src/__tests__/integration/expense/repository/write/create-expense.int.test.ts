import { EErrorCode } from '../../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseRepositoryWrite } from '../../../../../infraestructure/repository/expense/expense.repository.write';
import { createAuthenticatedUser } from '../../../helpers/auth.helper';

const repositoryWrite = new ExpenseRepositoryWrite();

describe('When creating expense with valid payload', () => {
  it('Should return the created expense', async () => {
    const { user } = await createAuthenticatedUser();
    const now = new Date();

    const result = await repositoryWrite.createExpense({
      id: 'expense-create-1',
      userId: user.id,
      name: 'Food',
      amount: 80,
      category: EExpenseCategory.FOOD,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
      createdAt: now,
      updatedAt: now,
    });

    expect(result).toMatchObject({
      id: 'expense-create-1',
      userId: user.id,
      name: 'Food',
    });
  });
});

describe('When creating expense with duplicated id', () => {
  it('Should throw DATABASE_ERROR', async () => {
    const { user } = await createAuthenticatedUser();
    const now = new Date();
    const payload = {
      id: 'expense-create-dup',
      userId: user.id,
      name: 'Food',
      amount: 80,
      category: EExpenseCategory.FOOD,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
      createdAt: now,
      updatedAt: now,
    };
    await repositoryWrite.createExpense(payload);

    await expect(repositoryWrite.createExpense(payload)).rejects.toMatchObject({
      status: 500,
      errorCode: EErrorCode.DATABASE_ERROR,
    });
  });
});
