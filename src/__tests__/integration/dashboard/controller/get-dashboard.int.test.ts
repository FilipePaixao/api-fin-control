import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

describe('When getting dashboard with authenticated user', () => {
  it('Should return summary for selected month', async () => {
    const { token } = await createAuthenticatedUser({
      salary: {
        amount: 4000,
        currency: ECurrency.BRL,
        paymentDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await createExpenseViaApi(token, {
      name: 'Rent',
      amount: 1800,
      category: EExpenseCategory.HOUSING,
      referenceMonth: '2026-06',
    });
    await createExpenseViaApi(token, {
      name: 'Groceries',
      amount: 600,
      category: EExpenseCategory.FOOD,
      referenceMonth: '2026-06',
    });

    const { body, statusCode } = await supertest(app.app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .query({ referenceMonth: '2026-06' });

    expect(statusCode).toBe(200);
    expect(body.salary).toBe(4000);
    expect(body.totalExpenses).toBe(2400);
    expect(body.totalPaid).toBe(0);
    expect(body.totalPending).toBe(2400);
    expect(body.availableBalance).toBe(4000);
  });
});

describe('When getting dashboard without access token', () => {
  it('Should return unauthorized status', async () => {
    const { statusCode } = await supertest(app.app).get('/api/dashboard');

    expect(statusCode).toBe(401);
  });
});
