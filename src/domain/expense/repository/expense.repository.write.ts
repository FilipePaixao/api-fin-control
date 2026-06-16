import { IExpense } from '../entity/interfaces/expense.interface';

export interface IExpenseRepositoryWrite {
  createExpense(expense: IExpense): Promise<IExpense>;
  updateExpenseById(id: string, payload: Partial<IExpense>): Promise<IExpense | null>;
  deleteExpenseById(id: string): Promise<IExpense | null>;
}
