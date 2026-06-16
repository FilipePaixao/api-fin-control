import { ExpenseServiceFactory } from '../../../../configuration/factory/expense.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

const expenseService = ExpenseServiceFactory.create();

describe('When getting expense by id through service from owner user', () => {
  it('Should return the expense', async () => {
    const owner = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Internet',
      amount: 140,
      category: EExpenseCategory.SUBSCRIPTIONS,
      referenceMonth: '2026-06',
    });

    const result = await expenseService.getExpenseById(
      owner.user.id,
      createdExpense.body.id as string,
    );

    expect(result).toMatchObject({
      id: createdExpense.body.id,
      userId: owner.user.id,
    });
  });
});

describe('When getting expense by id through service from another user', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const owner = await createAuthenticatedUser();
    const intruder = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Internet',
      amount: 140,
      category: EExpenseCategory.SUBSCRIPTIONS,
      referenceMonth: '2026-06',
    });

    await expect(
      expenseService.getExpenseById(intruder.user.id, createdExpense.body.id as string),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { expenseId: createdExpense.body.id },
    });
  });
});
