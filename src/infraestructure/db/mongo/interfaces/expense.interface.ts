import { Types } from 'mongoose';
import { IExpense } from '../../../../domain/expense/entity/interfaces/expense.interface';

export interface IMExpense extends Omit<IExpense, '_id'> {
  _id: Types.ObjectId;
}
