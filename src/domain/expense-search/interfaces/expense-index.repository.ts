import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';

export interface IExpenseIndexFilters {
  referenceMonth?: string;
  category?: EExpenseCategory;
  status?: EExpenseStatus;
}

export interface IExpenseIndexDocument {
  userId: string;
  expenseId: string;
  name: string;
  description?: string;
  category: EExpenseCategory;
  categoryLabel: string;
  status: EExpenseStatus;
  referenceMonth: string;
}

export interface IExpenseIndexRepository {
  ensureIndex(): Promise<void>;
  upsert(document: IExpenseIndexDocument): Promise<void>;
  delete(userId: string, expenseId: string): Promise<void>;
  search(
    userId: string,
    query: string,
    filters: IExpenseIndexFilters,
    limit: number,
  ): Promise<string[]>;
  recreateIndex(): Promise<void>;
}
