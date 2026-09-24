import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import {
  getStartOfTodaySaoPaulo,
  resolveExpenseStatus,
} from '../../../../domain/expense/utils/expense-status.utils';

describe('expense-status utils', () => {
  it('marks PENDING with past dueDate as OVERDUE', () => {
    const startOfToday = getStartOfTodaySaoPaulo(new Date('2026-09-24T15:00:00.000Z'));
    const expense = {
      id: '1',
      userId: 'user-1',
      name: 'Conta',
      amount: 100,
      category: EExpenseCategory.OTHER,
      status: EExpenseStatus.PENDING,
      dueDate: new Date('2026-09-20T12:00:00.000Z'),
      referenceMonth: '2026-09',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(resolveExpenseStatus(expense, startOfToday).status).toBe(EExpenseStatus.OVERDUE);
  });

  it('keeps PENDING without dueDate', () => {
    const startOfToday = getStartOfTodaySaoPaulo(new Date('2026-09-24T15:00:00.000Z'));
    const expense = {
      id: '1',
      userId: 'user-1',
      name: 'Conta',
      amount: 100,
      category: EExpenseCategory.OTHER,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-09',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(resolveExpenseStatus(expense, startOfToday).status).toBe(EExpenseStatus.PENDING);
  });
});
