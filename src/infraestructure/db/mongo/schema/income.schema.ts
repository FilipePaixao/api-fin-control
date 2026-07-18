import { Schema } from 'mongoose';
import { EIncomeCategory } from '../../../../domain/income/entity/enums/EIncomeCategory';
import { EIncomeStatus } from '../../../../domain/income/entity/enums/EIncomeStatus';
import { IMIncome } from '../interfaces/income.interface';

export const IncomeSchema = new Schema<IMIncome>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: Object.values(EIncomeCategory), required: true },
    referenceMonth: { type: String, required: true },
    receivedAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(EIncomeStatus),
      required: true,
      default: EIncomeStatus.EXPECTED,
    },
    source: { type: String },
  },
  { timestamps: true },
);

IncomeSchema.index({ userId: 1, referenceMonth: 1, status: 1, category: 1 });
