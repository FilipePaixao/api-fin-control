import { ExpenseServiceFactory } from '../../../../configuration/factory/expense.service.factory';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

const expenseService = ExpenseServiceFactory.create();

describe('When listing expenses through service with matching filters', () => {
  it('Should return only user expenses', async () => {
    const owner = await createAuthenticatedUser();
    const anotherUser = await createAuthenticatedUser();

    await createExpenseViaApi(owner.token, {
      name: 'Rent',
      amount: 1600,
      category: EExpenseCategory.HOUSING,
      referenceMonth: '2026-06',
    });
    await createExpenseViaApi(anotherUser.token, {
      name: 'Gym',
      amount: 120,
      category: EExpenseCategory.HEALTH,
      referenceMonth: '2026-06',
    });

    const result = await expenseService.listExpenses(owner.user.id, {
      referenceMonth: '2026-06',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      userId: owner.user.id,
      name: 'Rent',
    });
  });
});

describe('When listing expenses through service without matching filters', () => {
  it('Should return empty list', async () => {
    const owner = await createAuthenticatedUser();
    await createExpenseViaApi(owner.token, {
      name: 'Rent',
      amount: 1600,
      category: EExpenseCategory.HOUSING,
      referenceMonth: '2026-06',
    });

    const result = await expenseService.listExpenses(owner.user.id, {
      referenceMonth: '2026-07',
    });

    expect(result).toEqual([]);
  });
});
