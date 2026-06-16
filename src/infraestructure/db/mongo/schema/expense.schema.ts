import { Schema } from 'mongoose';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { EPaymentMethod } from '../../../../domain/expense/entity/enums/EPaymentMethod';
import { IMExpense } from '../interfaces/expense.interface';

export const ExpenseSchema = new Schema<IMExpense>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: Object.values(EExpenseCategory), required: true },
    paymentMethod: { type: String, enum: Object.values(EPaymentMethod) },
    status: {
      type: String,
      enum: Object.values(EExpenseStatus),
      required: true,
      default: EExpenseStatus.PENDING,
    },
    dueDate: { type: Date },
    paidAt: { type: Date },
    referenceMonth: { type: String, required: true },
  },
  { timestamps: true },
);

ExpenseSchema.index({ userId: 1, dueDate: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });
ExpenseSchema.index({ userId: 1, status: 1 });
ExpenseSchema.index({ userId: 1, referenceMonth: 1 });
