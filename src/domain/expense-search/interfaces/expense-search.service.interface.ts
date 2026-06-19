import { IExpense } from '../../expense/entity/interfaces/expense.interface';
import { IExpenseFilters } from '../../expense/interfaces/expense.service.interface';
import { IExpenseIndexFilters } from '../interfaces/expense-index.repository';

export interface IExpenseSearchService {
  searchExpenses(userId: string, filters: IExpenseFilters): Promise<IExpense[]>;
}

export function toExpenseIndexFilters(filters: IExpenseFilters): IExpenseIndexFilters {
  return {
    referenceMonth: filters.referenceMonth,
    category: filters.category,
    status: filters.status,
  };
}
