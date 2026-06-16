import { model } from 'mongoose';
import { IMExpense } from '../interfaces/expense.interface';
import { ExpenseSchema } from '../schema/expense.schema';

export const ExpenseModel = model<IMExpense>('Expense', ExpenseSchema);
