import { IIncome } from '../entity/interfaces/income.interface';

export interface IIncomeRepositoryWrite {
  createIncome(income: IIncome): Promise<IIncome>;
  updateIncomeById(id: string, payload: Partial<IIncome>): Promise<IIncome | null>;
  deleteIncomeById(id: string): Promise<IIncome | null>;
}
