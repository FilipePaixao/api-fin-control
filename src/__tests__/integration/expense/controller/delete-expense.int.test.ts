import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { ExpenseModel } from '../../../../infraestructure/db/mongo/models/expense.model';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

describe('When deleting an expense by id from the owner user', () => {
  it('Should delete the expense', async () => {
    const owner = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Car insurance',
      amount: 330,
      category: EExpenseCategory.INSURANCE,
      referenceMonth: '2026-06',
    });

    const response = await supertest(app.app)
      .delete(`/api/expenses/${createdExpense.body.id as string}`)
      .set('Authorization', `Bearer ${owner.token}`);

    const persistedExpense = await ExpenseModel.findOne({
      id: createdExpense.body.id as string,
    });

    expect(response.statusCode).toBe(204);
    expect(persistedExpense).toBeNull();
  });
});

describe('When deleting an expense by id from another user', () => {
  it('Should return 404', async () => {
    const owner = await createAuthenticatedUser();
    const intruder = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'School',
      amount: 500,
      category: EExpenseCategory.EDUCATION,
      referenceMonth: '2026-06',
    });

    const response = await supertest(app.app)
      .delete(`/api/expenses/${createdExpense.body.id as string}`)
      .set('Authorization', `Bearer ${intruder.token}`);

    expect(response.statusCode).toBe(404);
  });
});
