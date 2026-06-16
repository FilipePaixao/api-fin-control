import { EExpenseCategory } from '../enums/EExpenseCategory';
import { EPaymentMethod } from '../enums/EPaymentMethod';
import { EExpenseStatus } from '../enums/EExpenseStatus';

export interface IExpense {
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
}

export interface ICreateExpenseInput {
  userId: string;
  name: string;
  description?: string;
  amount: number;
  category: EExpenseCategory;
  paymentMethod?: EPaymentMethod;
  status?: EExpenseStatus;
  dueDate?: Date;
  referenceMonth: string;
}
