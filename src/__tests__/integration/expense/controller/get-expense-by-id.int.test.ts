import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

describe('When getting an expense by id from the owner user', () => {
  it('Should return the expense', async () => {
    const owner = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Phone',
      amount: 100,
      category: EExpenseCategory.SUBSCRIPTIONS,
      referenceMonth: '2026-06',
    });

    const response = await supertest(app.app)
      .get(`/api/expenses/${createdExpense.body.id as string}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      id: createdExpense.body.id,
      userId: owner.user.id,
      name: 'Phone',
    });
  });
});

describe('When getting an expense by id from another user', () => {
  it('Should return 404', async () => {
    const owner = await createAuthenticatedUser();
    const intruder = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Doctor',
      amount: 250,
      category: EExpenseCategory.HEALTH,
      referenceMonth: '2026-06',
    });

    const response = await supertest(app.app)
      .get(`/api/expenses/${createdExpense.body.id as string}`)
      .set('Authorization', `Bearer ${intruder.token}`);

    expect(response.statusCode).toBe(404);
  });
});
