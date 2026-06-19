import { generateId } from '../../common/utils/generate-id';
import { EExpenseCategory } from './enums/EExpenseCategory';
import { EPaymentMethod } from './enums/EPaymentMethod';
import { EExpenseStatus } from './enums/EExpenseStatus';
import {
  ICreateExpenseInput,
  IExpense,
} from './interfaces/expense.interface';

const REFERENCE_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export class ExpenseServiceEntity implements IExpense {
  id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  category: EExpenseCategory;
  paymentMethod?: EPaymentMethod;
  status: EExpenseStatus;
  dueDate?: Date;
  paidAt?: Date;
  referenceMonth: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(expense: IExpense | (ICreateExpenseInput & { id?: string })) {
    ExpenseServiceEntity.validateExpenseInput(expense);
    this.id = expense.id || generateId();
    this.userId = expense.userId;
    this.name = expense.name.trim();
    this.description = expense.description?.trim();
    this.amount = expense.amount;
    this.category = expense.category;
    this.paymentMethod = expense.paymentMethod;
    this.status =
      'status' in expense && expense.status
        ? expense.status
        : EExpenseStatus.PENDING;
    this.dueDate = expense.dueDate;
    this.paidAt = 'paidAt' in expense ? expense.paidAt : undefined;
    this.referenceMonth = expense.referenceMonth;
    this.createdAt =
      'createdAt' in expense && expense.createdAt
        ? expense.createdAt
        : new Date();
    this.updatedAt =
      'updatedAt' in expense && expense.updatedAt
        ? expense.updatedAt
        : new Date();
  }

  static validateExpenseInput(
    expense: Partial<IExpense> & {
      userId?: string;
      name?: string;
      amount?: number;
      category?: EExpenseCategory;
      referenceMonth?: string;
    },
  ): void {
    if (!expense.userId?.trim()) {
      throw new Error('User ID is required');
    }
    if (!expense.name?.trim()) {
      throw new Error('Expense name is required');
    }
    if (expense.amount === undefined || expense.amount <= 0) {
      throw new Error('Expense amount must be greater than zero');
    }
    if (
      expense.category &&
      !Object.values(EExpenseCategory).includes(expense.category)
    ) {
      throw new Error('Invalid expense category');
    }
    if (
      expense.paymentMethod &&
      !Object.values(EPaymentMethod).includes(expense.paymentMethod)
    ) {
      throw new Error('Invalid payment method');
    }
    if (
      expense.status &&
      !Object.values(EExpenseStatus).includes(expense.status)
    ) {
      throw new Error('Invalid expense status');
    }
    if (
      expense.referenceMonth &&
      !REFERENCE_MONTH_REGEX.test(expense.referenceMonth)
    ) {
      throw new Error('Reference month must be in YYYY-MM format');
    }
  }
}
