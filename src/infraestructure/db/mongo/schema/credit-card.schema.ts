import { Schema } from 'mongoose';
import { IMCreditCard } from '../interfaces/credit-card.interface';

export const CreditCardSchema = new Schema<IMCreditCard>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    lastFourDigits: { type: String },
  },
  { timestamps: true },
);

CreditCardSchema.index({ userId: 1, name: 1 });
