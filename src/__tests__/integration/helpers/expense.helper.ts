import supertest from 'supertest';
import { EExpenseCategory } from '../../../domain/expense/entity/enums/EExpenseCategory';
import { app } from '../../../../jest/setup-integration-tests';

export interface ICreateExpenseViaApiPayload {
  name: string;
  amount: number;
  category: EExpenseCategory;
  referenceMonth: string;
  description?: string;
}

export async function createExpenseViaApi(
  token: string,
  payload: ICreateExpenseViaApiPayload,
) {
  return supertest(app.app)
    .post('/api/expenses')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}
