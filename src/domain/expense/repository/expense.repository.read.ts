import { EExpenseCategory } from '../entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../entity/enums/EExpenseStatus';
import { IExpense } from '../entity/interfaces/expense.interface';

export interface IExpenseReadFilter {
  userId: string;
  category?: EExpenseCategory;
  status?: EExpenseStatus;
  referenceMonth?: string;
  from?: Date;
  to?: Date;
}

export interface IExpenseRepositoryRead {
  findExpenseById(id: string): Promise<IExpense | null>;
  listExpenses(filter: IExpenseReadFilter): Promise<IExpense[]>;
}
