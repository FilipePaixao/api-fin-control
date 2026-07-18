import { EIncomeCategory } from '../enums/EIncomeCategory';
import { EIncomeStatus } from '../enums/EIncomeStatus';

export interface IIncome {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: EIncomeCategory;
  referenceMonth: string;
  receivedAt?: Date;
  status: EIncomeStatus;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateIncomeInput {
  userId: string;
  name: string;
  amount: number;
  category: EIncomeCategory;
  referenceMonth: string;
  receivedAt?: Date;
  status?: EIncomeStatus;
  source?: string;
}
