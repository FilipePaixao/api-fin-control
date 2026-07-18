import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';
import { EIncomeCategory } from '../../income/entity/enums/EIncomeCategory';
import { ECurrency } from '../../user/entity/enums/ECurrency';

export interface IDashboardByCategory {
  category: EExpenseCategory;
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export interface IDashboardByIncomeCategory {
  category: EIncomeCategory;
  total: number;
  received: number;
  expected: number;
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
  totalIncome: number;
  effectiveIncome: number | null;
  usingSalaryFallback: boolean;
  totalExpenses: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  availableBalance: number | null;
  incomeCommitmentPercent: number | null;
  incomesByCategory: IDashboardByIncomeCategory[];
  byCategory: IDashboardByCategory[];
  topExpenses: IDashboardTopExpense[];
}

export interface IDashboardService {
  getDashboardSummary(userId: string, referenceMonth?: string): Promise<IDashboardSummary>;
}
