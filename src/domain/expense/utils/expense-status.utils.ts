import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';
import { IExpense } from '../../expense/entity/interfaces/expense.interface';

const SAO_PAULO_TZ = 'America/Sao_Paulo';

/** Start of the current calendar day in America/Sao_Paulo, as a Date instant. */
export function getStartOfTodaySaoPaulo(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) {
    return new Date(now);
  }

  // America/Sao_Paulo is UTC-3 year-round (no DST since 2019).
  return new Date(`${year}-${month}-${day}T00:00:00.000-03:00`);
}

export function isPendingExpenseOverdue(
  expense: Pick<IExpense, 'status' | 'dueDate'>,
  startOfToday: Date = getStartOfTodaySaoPaulo(),
): boolean {
  return (
    expense.status === EExpenseStatus.PENDING &&
    Boolean(expense.dueDate) &&
    expense.dueDate! < startOfToday
  );
}

export function resolveExpenseStatus(
  expense: IExpense,
  startOfToday: Date = getStartOfTodaySaoPaulo(),
): IExpense {
  if (isPendingExpenseOverdue(expense, startOfToday)) {
    return { ...expense, status: EExpenseStatus.OVERDUE };
  }
  return expense;
}

export function resolveExpensesStatus(
  expenses: IExpense[],
  startOfToday: Date = getStartOfTodaySaoPaulo(),
): IExpense[] {
  return expenses.map((expense) => resolveExpenseStatus(expense, startOfToday));
}
