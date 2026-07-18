import { IExpenseRepositoryRead } from '../../expense/repository/expense.repository.read';
import { IIncome } from '../../income/entity/interfaces/income.interface';
import { IIncomeRepositoryRead } from '../../income/repository/income.repository.read';
import {
  IDashboardByCategory,
  IDashboardByIncomeCategory,
  IDashboardService,
  IDashboardSummary,
} from '../interfaces/dashboard.service.interface';
import { IUserRepositoryRead } from '../../user/repository/user.repository.read';
import { IExpense } from '../../expense/entity/interfaces/expense.interface';
import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';
import { EIncomeCategory } from '../../income/entity/enums/EIncomeCategory';
import { EIncomeStatus } from '../../income/entity/enums/EIncomeStatus';

interface IParamsDashboardService {
  userRepositoryRead: IUserRepositoryRead;
  expenseRepositoryRead: IExpenseRepositoryRead;
  incomeRepositoryRead: IIncomeRepositoryRead;
}

export class DashboardService implements IDashboardService {
  private readonly userRepositoryRead: IUserRepositoryRead;
  private readonly expenseRepositoryRead: IExpenseRepositoryRead;
  private readonly incomeRepositoryRead: IIncomeRepositoryRead;

  constructor({
    userRepositoryRead,
    expenseRepositoryRead,
    incomeRepositoryRead,
  }: IParamsDashboardService) {
    this.userRepositoryRead = userRepositoryRead;
    this.expenseRepositoryRead = expenseRepositoryRead;
    this.incomeRepositoryRead = incomeRepositoryRead;
  }

  async getDashboardSummary(
    userId: string,
    referenceMonth?: string,
  ): Promise<IDashboardSummary> {
    const [user, expenses, incomes] = await Promise.all([
      this.userRepositoryRead.findUserById(userId),
      this.expenseRepositoryRead.listExpenses({
        userId,
        referenceMonth,
      }),
      this.incomeRepositoryRead.listIncomes({
        userId,
        referenceMonth,
      }),
    ]);

    const salaryAmount = user?.salary?.amount ?? null;
    const currency = user?.salary?.currency ?? null;
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const usingSalaryFallback = totalIncome === 0 && salaryAmount !== null;
    const effectiveIncome = totalIncome > 0 ? totalIncome : salaryAmount;

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
      totalIncome,
      effectiveIncome,
      usingSalaryFallback,
      totalExpenses: totals.totalExpenses,
      totalPaid: totals.totalPaid,
      totalPending: totals.totalPending,
      totalOverdue: totals.totalOverdue,
      availableBalance:
        effectiveIncome !== null ? effectiveIncome - totals.totalPaid : null,
      incomeCommitmentPercent:
        effectiveIncome && effectiveIncome > 0
          ? Number(((totals.totalPaid / effectiveIncome) * 100).toFixed(2))
          : null,
      incomesByCategory: this.buildIncomesByCategory(incomes),
      byCategory: this.buildByCategory(expenses),
      topExpenses: this.buildTopExpenses(expenses),
    };
  }

  private buildIncomesByCategory(incomes: IIncome[]): IDashboardByIncomeCategory[] {
    return Object.values(EIncomeCategory).map((category) => {
      const incomesInCategory = incomes.filter((income) => income.category === category);
      return {
        category,
        total: incomesInCategory.reduce((acc, income) => acc + income.amount, 0),
        received: incomesInCategory
          .filter((income) => income.status === EIncomeStatus.RECEIVED)
          .reduce((acc, income) => acc + income.amount, 0),
        expected: incomesInCategory
          .filter((income) => income.status === EIncomeStatus.EXPECTED)
          .reduce((acc, income) => acc + income.amount, 0),
      };
    });
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
