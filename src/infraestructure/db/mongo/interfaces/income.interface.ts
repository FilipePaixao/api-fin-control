import { Types } from 'mongoose';
import { IIncome } from '../../../../domain/income/entity/interfaces/income.interface';

export interface IMIncome extends Omit<IIncome, '_id'> {
  _id: Types.ObjectId;
}
