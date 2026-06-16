import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseModel } from '../../../../infraestructure/db/mongo/models/expense.model';
import { createAuthenticatedUser } from '../../helpers/auth.helper';

describe('When creating an expense with authenticated user', () => {
  it('Should create the expense', async () => {
    const { user, token } = await createAuthenticatedUser();

    const response = await supertest(app.app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Internet',
        amount: 120,
        category: EExpenseCategory.SUBSCRIPTIONS,
        referenceMonth: '2026-06',
      });

    const persistedExpense = await ExpenseModel.findOne({ id: response.body.id });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      userId: user.id,
      name: 'Internet',
      amount: 120,
      category: EExpenseCategory.SUBSCRIPTIONS,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
    });
    expect(persistedExpense).not.toBeNull();
  });
});

describe('When creating an expense without authentication', () => {
  it('Should return 401', async () => {
    const response = await supertest(app.app).post('/api/expenses').send({
      name: 'Internet',
      amount: 120,
      category: EExpenseCategory.SUBSCRIPTIONS,
      referenceMonth: '2026-06',
    });

    expect(response.statusCode).toBe(401);
  });
});
