import { IIncome } from '../../../../domain/income/entity/interfaces/income.interface';
import { IMIncome } from '../../../db/mongo/interfaces/income.interface';

export function dbToInternal(income: IMIncome): IIncome {
  return {
    id: income.id,
    userId: income.userId,
    name: income.name,
    amount: income.amount,
    category: income.category,
    referenceMonth: income.referenceMonth,
    receivedAt: income.receivedAt,
    status: income.status,
    source: income.source,
    createdAt: income.createdAt,
    updatedAt: income.updatedAt,
  };
}

export function internalToDb(
  income: IIncome,
): Omit<IMIncome, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    id: income.id,
    userId: income.userId,
    name: income.name,
    amount: income.amount,
    category: income.category,
    referenceMonth: income.referenceMonth,
    receivedAt: income.receivedAt,
    status: income.status,
    source: income.source,
  };
}
