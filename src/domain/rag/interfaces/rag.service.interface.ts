import { IExpense } from '../../expense/entity/interfaces/expense.interface';
import { IExpenseIndexFilters } from '../../expense-search/interfaces/expense-index.repository';
import { EEmbeddingSourceType } from '../entity/enums/EEmbeddingSourceType';

export interface IRagSource {
  sourceType: EEmbeddingSourceType;
  sourceId: string;
  excerpt: string;
  score: number;
}

export interface IRagAnswer {
  answer: string;
  sources: IRagSource[];
}

export interface IRagService {
  syncUserFinancialContext(userId: string): Promise<void>;
  syncExpense(userId: string, expense: IExpense): Promise<void>;
  removeExpense(userId: string, expenseId: string): Promise<void>;
  searchExpenses(
    userId: string,
    query: string,
    filters: IExpenseIndexFilters,
    limit: number,
  ): Promise<string[]>;
  askFinancialQuestion(userId: string, question: string): Promise<IRagAnswer>;
}
