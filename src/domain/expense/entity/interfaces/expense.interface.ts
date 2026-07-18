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
  installmentGroupId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  totalAmount?: number;
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
  installmentGroupId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  totalAmount?: number;
}

export interface ICreateInstallmentExpenseInput {
  userId: string;
  name: string;
  description?: string;
  totalAmount: number;
  totalInstallments: number;
  category: EExpenseCategory;
  paymentMethod?: EPaymentMethod;
  dueDate?: Date;
  referenceMonth: string;
}
