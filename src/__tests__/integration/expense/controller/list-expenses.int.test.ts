import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

describe('When listing expenses with authenticated user', () => {
  it('Should return only user expenses for the selected filter', async () => {
    const owner = await createAuthenticatedUser();
    const anotherUser = await createAuthenticatedUser();

    await createExpenseViaApi(owner.token, {
      name: 'Rent',
      amount: 1800,
      category: EExpenseCategory.HOUSING,
      referenceMonth: '2026-06',
    });
    await createExpenseViaApi(anotherUser.token, {
      name: 'Gym',
      amount: 120,
      category: EExpenseCategory.HEALTH,
      referenceMonth: '2026-06',
    });

    const response = await supertest(app.app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${owner.token}`)
      .query({ referenceMonth: '2026-06' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      userId: owner.user.id,
      name: 'Rent',
    });
  });
});

describe('When listing expenses without authentication', () => {
  it('Should return 401', async () => {
    const response = await supertest(app.app).get('/api/expenses');
    expect(response.statusCode).toBe(401);
  });
});
