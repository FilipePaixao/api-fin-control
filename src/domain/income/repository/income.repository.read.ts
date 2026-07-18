import { EIncomeCategory } from '../entity/enums/EIncomeCategory';
import { EIncomeStatus } from '../entity/enums/EIncomeStatus';
import { IIncome } from '../entity/interfaces/income.interface';

export interface IIncomeReadFilter {
  userId: string;
  category?: EIncomeCategory;
  status?: EIncomeStatus;
  referenceMonth?: string;
}

export interface IIncomeRepositoryRead {
  findIncomeById(id: string): Promise<IIncome | null>;
  listIncomes(filter: IIncomeReadFilter): Promise<IIncome[]>;
}
