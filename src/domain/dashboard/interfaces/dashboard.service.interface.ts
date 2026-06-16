import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';
import { ECurrency } from '../../user/entity/enums/ECurrency';

export interface IDashboardByCategory {
  category: EExpenseCategory;
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export interface IDashboardTopExpense {
  id: string;
  name: string;
  amount: number;
  status: EExpenseStatus;
  category: EExpenseCategory;
  dueDate?: Date;
  referenceMonth: string;
}

export interface IDashboardSummary {
  salary: number | null;
  currency: ECurrency | null;
  totalExpenses: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  availableBalance: number | null;
  incomeCommitmentPercent: number | null;
  byCategory: IDashboardByCategory[];
  topExpenses: IDashboardTopExpense[];
}

export interface IDashboardService {
  getDashboardSummary(userId: string, referenceMonth?: string): Promise<IDashboardSummary>;
}
