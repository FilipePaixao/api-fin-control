import { IExpenseRepositoryRead } from '../../expense/repository/expense.repository.read';
import {
  IDashboardByCategory,
  IDashboardService,
  IDashboardSummary,
} from '../interfaces/dashboard.service.interface';
import { IUserRepositoryRead } from '../../user/repository/user.repository.read';
import { IExpense } from '../../expense/entity/interfaces/expense.interface';
import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';

interface IParamsDashboardService {
  userRepositoryRead: IUserRepositoryRead;
  expenseRepositoryRead: IExpenseRepositoryRead;
}

export class DashboardService implements IDashboardService {
  private readonly userRepositoryRead: IUserRepositoryRead;
  private readonly expenseRepositoryRead: IExpenseRepositoryRead;

  constructor({ userRepositoryRead, expenseRepositoryRead }: IParamsDashboardService) {
    this.userRepositoryRead = userRepositoryRead;
    this.expenseRepositoryRead = expenseRepositoryRead;
  }

  async getDashboardSummary(
    userId: string,
    referenceMonth?: string,
  ): Promise<IDashboardSummary> {
    const [user, expenses] = await Promise.all([
      this.userRepositoryRead.findUserById(userId),
      this.expenseRepositoryRead.listExpenses({
        userId,
        referenceMonth,
      }),
    ]);

    const salaryAmount = user?.salary?.amount ?? null;
    const currency = user?.salary?.currency ?? null;

    const totals = expenses.reduce(
      (acc, expense) => {
        acc.totalExpenses += expense.amount;
        if (expense.status === EExpenseStatus.PAID) acc.totalPaid += expense.amount;
        if (expense.status === EExpenseStatus.PENDING) acc.totalPending += expense.amount;
        if (expense.status === EExpenseStatus.OVERDUE) acc.totalOverdue += expense.amount;
        return acc;
      },
      { totalExpenses: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0 },
    );

    return {
      salary: salaryAmount,
      currency,
      totalExpenses: totals.totalExpenses,
      totalPaid: totals.totalPaid,
      totalPending: totals.totalPending,
      totalOverdue: totals.totalOverdue,
      availableBalance: salaryAmount !== null ? salaryAmount - totals.totalPaid : null,
      incomeCommitmentPercent:
        salaryAmount && salaryAmount > 0
          ? Number(((totals.totalPaid / salaryAmount) * 100).toFixed(2))
          : null,
      byCategory: this.buildByCategory(expenses),
      topExpenses: this.buildTopExpenses(expenses),
    };
  }

  private buildByCategory(expenses: IExpense[]): IDashboardByCategory[] {
    return Object.values(EExpenseCategory).map((category) => {
      const expensesInCategory = expenses.filter(
        (expense) => expense.category === category,
      );
      return {
        category,
        total: expensesInCategory.reduce((acc, expense) => acc + expense.amount, 0),
        paid: expensesInCategory
          .filter((expense) => expense.status === EExpenseStatus.PAID)
          .reduce((acc, expense) => acc + expense.amount, 0),
        pending: expensesInCategory
          .filter((expense) => expense.status === EExpenseStatus.PENDING)
          .reduce((acc, expense) => acc + expense.amount, 0),
        overdue: expensesInCategory
          .filter((expense) => expense.status === EExpenseStatus.OVERDUE)
          .reduce((acc, expense) => acc + expense.amount, 0),
      };
    });
  }

  private buildTopExpenses(expenses: IExpense[]) {
    return [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((expense) => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        status: expense.status,
        category: expense.category,
        dueDate: expense.dueDate,
        referenceMonth: expense.referenceMonth,
      }));
  }
}
