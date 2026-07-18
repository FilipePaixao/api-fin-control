import { model } from 'mongoose';
import { IMIncome } from '../interfaces/income.interface';
import { IncomeSchema } from '../schema/income.schema';

export const IncomeModel = model<IMIncome>('Income', IncomeSchema);
