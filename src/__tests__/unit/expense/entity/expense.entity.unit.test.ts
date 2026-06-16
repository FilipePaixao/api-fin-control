import { Types } from 'mongoose';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EPaymentMethod } from '../../../../domain/expense/entity/enums/EPaymentMethod';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { ExpenseServiceEntity } from '../../../../domain/expense/entity/expense.entity';

describe('when validating expense entity', () => {
  const baseExpense = {
    userId: new Types.ObjectId().toHexString(),
    name: 'Groceries',
    amount: 250.5,
    category: EExpenseCategory.FOOD,
    paymentMethod: EPaymentMethod.PIX,
    referenceMonth: '2026-06',
  };

  it('should create expense with default PENDING status', () => {
    const expense = new ExpenseServiceEntity(baseExpense);
    expect(expense.status).toBe(EExpenseStatus.PENDING);
    expect(expense.category).toBe(EExpenseCategory.FOOD);
  });

  it('should reject non-positive amount', () => {
    expect(
      () =>
        new ExpenseServiceEntity({
          ...baseExpense,
          amount: 0,
        }),
    ).toThrow(/greater than zero/);
  });

  it('should reject invalid reference month format', () => {
    expect(
      () =>
        new ExpenseServiceEntity({
          ...baseExpense,
          referenceMonth: '06-2026',
        }),
    ).toThrow(/YYYY-MM/);
  });

  it('should reject invalid category enum value', () => {
    expect(() =>
      ExpenseServiceEntity.validateExpenseInput({
        ...baseExpense,
        category: 'INVALID' as EExpenseCategory,
      }),
    ).toThrow(/Invalid expense category/);
  });

  it('should accept all expense status enum members', () => {
    for (const status of Object.values(EExpenseStatus)) {
      const expense = new ExpenseServiceEntity({
        ...baseExpense,
        status,
      });
      expect(expense.status).toBe(status);
    }
  });
});
