import { Types } from 'mongoose';
import { ICreditCard } from '../../../../domain/credit-card/entity/interfaces/credit-card.interface';

export interface IMCreditCard extends Omit<ICreditCard, '_id'> {
  _id: Types.ObjectId;
}
