import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { EPaymentMethod } from '../../../../domain/expense/entity/enums/EPaymentMethod';
import { createAuthenticatedUser } from '../../helpers/auth.helper';
import { createExpenseViaApi } from '../../helpers/expense.helper';

describe('When paying an expense by id from the owner user', () => {
  it('Should mark the expense as paid', async () => {
    const owner = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Electricity',
      amount: 210,
      category: EExpenseCategory.HOUSING,
      referenceMonth: '2026-06',
    });

    const response = await supertest(app.app)
      .patch(`/api/expenses/${createdExpense.body.id as string}/pay`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        paymentMethod: EPaymentMethod.PIX,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      id: createdExpense.body.id,
      status: EExpenseStatus.PAID,
      paymentMethod: EPaymentMethod.PIX,
    });
  });
});

describe('When paying an expense by id from another user', () => {
  it('Should return 404', async () => {
    const owner = await createAuthenticatedUser();
    const intruder = await createAuthenticatedUser();
    const createdExpense = await createExpenseViaApi(owner.token, {
      name: 'Dental',
      amount: 410,
      category: EExpenseCategory.HEALTH,
      referenceMonth: '2026-06',
    });

    const response = await supertest(app.app)
      .patch(`/api/expenses/${createdExpense.body.id as string}/pay`)
      .set('Authorization', `Bearer ${intruder.token}`)
      .send({ paymentMethod: EPaymentMethod.CREDIT_CARD });

    expect(response.statusCode).toBe(404);
  });
});
