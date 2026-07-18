import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { IIncome } from '../../../domain/income/entity/interfaces/income.interface';
import { IIncomeRepositoryWrite } from '../../../domain/income/repository/income.repository.write';
import { IncomeModel } from '../../db/mongo/models/income.model';
import { dbToInternal, internalToDb } from './adapters/income.adapter';

export class IncomeRepositoryWrite implements IIncomeRepositoryWrite {
  async createIncome(income: IIncome): Promise<IIncome> {
    try {
      const createdIncome = await IncomeModel.create(internalToDb(income));
      return dbToInternal(createdIncome);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'IncomeRepositoryWrite.createIncome',
        eventData: { incomeId: income.id, userId: income.userId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async updateIncomeById(
    id: string,
    payload: Partial<IIncome>,
  ): Promise<IIncome | null> {
    try {
      const updatedIncome = await IncomeModel.findOneAndUpdate(
        { id },
        { $set: payload },
        { new: true },
      );
      return updatedIncome ? dbToInternal(updatedIncome) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'IncomeRepositoryWrite.updateIncomeById',
        eventData: { id, payload },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async deleteIncomeById(id: string): Promise<IIncome | null> {
    try {
      const deletedIncome = await IncomeModel.findOneAndDelete({ id });
      return deletedIncome ? dbToInternal(deletedIncome) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'IncomeRepositoryWrite.deleteIncomeById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
