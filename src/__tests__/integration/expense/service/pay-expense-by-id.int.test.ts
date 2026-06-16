import { ExpenseServiceFactory } from '../../../../configuration/factory/expense.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { EPaymentMethod } from '../../../../domain/expense/entity/enums/EPaymentMethod';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

const expenseService = ExpenseServiceFactory.create();

describe('When paying expense by id through service from owner user', () => {
  it('Should return paid expense', async () => {
    const owner = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'School',
      amount: 700,
      category: EExpenseCategory.EDUCATION,
      referenceMonth: '2026-06',
    });

    const result = await expenseService.payExpenseById(
      owner.user.id,
      createdExpense.body.id as string,
      { paymentMethod: EPaymentMethod.PIX },
    );

    expect(result).toMatchObject({
      id: createdExpense.body.id,
      status: EExpenseStatus.PAID,
      paymentMethod: EPaymentMethod.PIX,
    });
  });
});

describe('When paying expense by id through service from another user', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const owner = await createAuthenticatedUser();
    const intruder = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'School',
      amount: 700,
      category: EExpenseCategory.EDUCATION,
      referenceMonth: '2026-06',
    });

    await expect(
      expenseService.payExpenseById(intruder.user.id, createdExpense.body.id as string, {}),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { expenseId: createdExpense.body.id },
    });
  });
});
