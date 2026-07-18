import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EIncomeCategory } from '../../../../domain/income/entity/enums/EIncomeCategory';
import { EIncomeStatus } from '../../../../domain/income/entity/enums/EIncomeStatus';
import { IncomeModel } from '../../../../infraestructure/db/mongo/models/income.model';
import { createAuthenticatedUser } from '../../helpers/auth.helper';

describe('When creating an income with authenticated user', () => {
  it('Should create the income', async () => {
    const { user, token } = await createAuthenticatedUser();

    const response = await supertest(app.app)
      .post('/api/incomes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Salário CLT',
        amount: 8000,
        category: EIncomeCategory.SALARY,
        referenceMonth: '2026-06',
      });

    const persistedIncome = await IncomeModel.findOne({ id: response.body.id });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      userId: user.id,
      name: 'Salário CLT',
      amount: 8000,
      category: EIncomeCategory.SALARY,
      status: EIncomeStatus.EXPECTED,
      referenceMonth: '2026-06',
    });
    expect(persistedIncome).not.toBeNull();
  });
});
