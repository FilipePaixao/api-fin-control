import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { ExpenseModel } from '../../../../infraestructure/db/mongo/models/expense.model';
import { createAuthenticatedUser } from '../../helpers/auth.helper';

describe('When creating installment expenses', () => {
  it('Should create all installments', async () => {
    const { user, token } = await createAuthenticatedUser();

    const response = await supertest(app.app)
      .post('/api/expenses/installments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Notebook',
        totalAmount: 6000,
        totalInstallments: 12,
        category: EExpenseCategory.DEBT,
        referenceMonth: '2026-01',
      });

    const persisted = await ExpenseModel.find({ userId: user.id });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveLength(12);
    expect(persisted).toHaveLength(12);
    expect(response.body[0].installmentGroupId).toBe(response.body[11].installmentGroupId);
  });
});
