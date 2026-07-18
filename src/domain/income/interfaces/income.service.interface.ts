import { EIncomeCategory } from '../entity/enums/EIncomeCategory';
import { EIncomeStatus } from '../entity/enums/EIncomeStatus';
import { ICreateIncomeInput, IIncome } from '../entity/interfaces/income.interface';
import { IIncomeRepositoryRead } from '../repository/income.repository.read';
import { IIncomeRepositoryWrite } from '../repository/income.repository.write';

export interface IIncomeFilters {
  category?: EIncomeCategory;
  status?: EIncomeStatus;
  referenceMonth?: string;
}

export interface IUpdateIncomeInput {
  name?: string;
  amount?: number;
  category?: EIncomeCategory;
  referenceMonth?: string;
  receivedAt?: Date;
  status?: EIncomeStatus;
  source?: string;
}

export interface IReceiveIncomeInput {
  receivedAt?: Date;
}

export interface IParamsIncomeService {
  incomeRepositoryRead: IIncomeRepositoryRead;
  incomeRepositoryWrite: IIncomeRepositoryWrite;
}

export interface IIncomeService {
  createIncome(userId: string, payload: ICreateIncomeInput): Promise<IIncome>;
  listIncomes(userId: string, filters: IIncomeFilters): Promise<IIncome[]>;
  getIncomeById(userId: string, incomeId: string): Promise<IIncome>;
  updateIncomeById(
    userId: string,
    incomeId: string,
    payload: IUpdateIncomeInput,
  ): Promise<IIncome>;
  deleteIncomeById(userId: string, incomeId: string): Promise<void>;
  receiveIncomeById(
    userId: string,
    incomeId: string,
    payload: IReceiveIncomeInput,
  ): Promise<IIncome>;
}
