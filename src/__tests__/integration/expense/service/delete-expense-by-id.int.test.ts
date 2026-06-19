import { ExpenseServiceFactory } from '../../../../configuration/factory/expense.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { ExpenseModel } from '../../../../infraestructure/db/mongo/models/expense.model';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

const expenseService = ExpenseServiceFactory.create();

describe('When deleting expense by id through service from owner user', () => {
  it('Should delete the expense', async () => {
    const owner = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Insurance',
      amount: 500,
      category: EExpenseCategory.HEALTH,
      referenceMonth: '2026-06',
    });

    await expenseService.deleteExpenseById(owner.user.id, createdExpense.body.id as string);

    const persistedExpense = await ExpenseModel.findOne({
      id: createdExpense.body.id as string,
    });

    expect(persistedExpense).toBeNull();
  });
});

describe('When deleting expense by id through service from another user', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const owner = await createAuthenticatedUser();
    const intruder = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Insurance',
      amount: 500,
      category: EExpenseCategory.HEALTH,
      referenceMonth: '2026-06',
    });

    await expect(
      expenseService.deleteExpenseById(intruder.user.id, createdExpense.body.id as string),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { expenseId: createdExpense.body.id },
    });
  });
});
