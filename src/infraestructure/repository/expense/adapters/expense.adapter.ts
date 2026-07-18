import { IExpense } from '../../../../domain/expense/entity/interfaces/expense.interface';
import { IMExpense } from '../../../db/mongo/interfaces/expense.interface';

export function dbToInternal(expense: IMExpense): IExpense {
  return {
    id: expense.id,
    userId: expense.userId,
    name: expense.name,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    status: expense.status,
    dueDate: expense.dueDate,
    paidAt: expense.paidAt,
    referenceMonth: expense.referenceMonth,
    installmentGroupId: expense.installmentGroupId,
    installmentNumber: expense.installmentNumber,
    totalInstallments: expense.totalInstallments,
    totalAmount: expense.totalAmount,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export function internalToDb(
  expense: IExpense,
): Omit<IMExpense, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    id: expense.id,
    userId: expense.userId,
    name: expense.name,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    status: expense.status,
    dueDate: expense.dueDate,
    paidAt: expense.paidAt,
    referenceMonth: expense.referenceMonth,
    installmentGroupId: expense.installmentGroupId,
    installmentNumber: expense.installmentNumber,
    totalInstallments: expense.totalInstallments,
    totalAmount: expense.totalAmount,
  };
}
