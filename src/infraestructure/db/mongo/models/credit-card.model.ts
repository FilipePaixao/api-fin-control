import { model } from 'mongoose';
import { IMCreditCard } from '../interfaces/credit-card.interface';
import { CreditCardSchema } from '../schema/credit-card.schema';

export const CreditCardModel = model<IMCreditCard>('CreditCard', CreditCardSchema);
