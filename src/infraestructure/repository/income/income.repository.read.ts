import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import {
  IIncomeReadFilter,
  IIncomeRepositoryRead,
} from '../../../domain/income/repository/income.repository.read';
import { IIncome } from '../../../domain/income/entity/interfaces/income.interface';
import { IncomeModel } from '../../db/mongo/models/income.model';
import { dbToInternal } from './adapters/income.adapter';

export class IncomeRepositoryRead implements IIncomeRepositoryRead {
  async findIncomeById(id: string): Promise<IIncome | null> {
    try {
      const income = await IncomeModel.findOne({ id });
      return income ? dbToInternal(income) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'IncomeRepositoryRead.findIncomeById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async listIncomes(filter: IIncomeReadFilter): Promise<IIncome[]> {
    try {
      const query: Record<string, unknown> = { userId: filter.userId };

      if (filter.category) {
        query.category = filter.category;
      }
      if (filter.status) {
        query.status = filter.status;
      }
      if (filter.referenceMonth) {
        query.referenceMonth = filter.referenceMonth;
      }

      const incomes = await IncomeModel.find(query).sort({
        referenceMonth: -1,
        createdAt: -1,
      });
      return incomes.map(dbToInternal);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'IncomeRepositoryRead.listIncomes',
        eventData: { filter },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
