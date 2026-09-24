import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EIncomeCategory } from '../../../../domain/income/entity/enums/EIncomeCategory';
import { ExpenseModel } from '../../../../infraestructure/db/mongo/models/expense.model';
import { IncomeModel } from '../../../../infraestructure/db/mongo/models/income.model';
import { createAuthenticatedUser } from '../../helpers/auth.helper';

describe('When confirming statement import', () => {
  it('Should create selected expenses and incomes', async () => {
    const { user, token } = await createAuthenticatedUser();

    const response = await supertest(app.app)
      .post('/api/imports/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({
        documentType: 'STATEMENT',
        transactions: [
          {
            kind: 'EXPENSE',
            name: 'Mercado',
            amount: 80.5,
            date: '2026-09-10',
            referenceMonth: '2026-09',
            category: EExpenseCategory.FOOD,
            paymentMethod: 'DEBIT_CARD',
            selected: true,
          },
          {
            kind: 'INCOME',
            name: 'Freelance',
            amount: 1500,
            date: '2026-09-12',
            referenceMonth: '2026-09',
            category: EIncomeCategory.FREELANCE,
            selected: true,
          },
        ],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.expenses).toHaveLength(1);
    expect(response.body.incomes).toHaveLength(1);
    expect(response.body.expenses[0]).toMatchObject({
      userId: user.id,
      name: 'Mercado',
      amount: 80.5,
      category: EExpenseCategory.FOOD,
    });
    expect(response.body.incomes[0]).toMatchObject({
      userId: user.id,
      name: 'Freelance',
      amount: 1500,
      category: EIncomeCategory.FREELANCE,
    });

    const persistedExpense = await ExpenseModel.findOne({ id: response.body.expenses[0].id });
    const persistedIncome = await IncomeModel.findOne({ id: response.body.incomes[0].id });
    expect(persistedExpense).not.toBeNull();
    expect(persistedIncome).not.toBeNull();
  });
});

describe('When analyzing import without authentication', () => {
  it('Should return 401', async () => {
    const response = await supertest(app.app)
      .post('/api/imports/analyze')
      .field('documentType', 'INVOICE')
      .attach('file', Buffer.from('%PDF-1.4'), 'invoice.pdf');

    expect(response.statusCode).toBe(401);
  });
});

describe('When analyzing import with invalid PDF', () => {
  it('Should return 400', async () => {
    const { token } = await createAuthenticatedUser();

    const response = await supertest(app.app)
      .post('/api/imports/analyze')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'INVOICE')
      .attach('file', Buffer.from('not-a-pdf'), 'fake.pdf');

    expect(response.statusCode).toBe(400);
  });
});
