import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

describe('When updating an expense by id from the owner user', () => {
  it('Should update the expense', async () => {
    const owner = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Water',
      amount: 90,
      category: EExpenseCategory.HOUSING,
      referenceMonth: '2026-06',
    });

    const response = await supertest(app.app)
      .put(`/api/expenses/${createdExpense.body.id as string}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ amount: 110 });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      id: createdExpense.body.id,
      amount: 110,
    });
  });
});

describe('When updating an expense by id from another user', () => {
  it('Should return 404', async () => {
    const owner = await createAuthenticatedUser();
    const intruder = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Gas',
      amount: 220,
      category: EExpenseCategory.HOUSING,
      referenceMonth: '2026-06',
    });

    const response = await supertest(app.app)
      .put(`/api/expenses/${createdExpense.body.id as string}`)
      .set('Authorization', `Bearer ${intruder.token}`)
      .send({ amount: 250 });

    expect(response.statusCode).toBe(404);
  });
});
