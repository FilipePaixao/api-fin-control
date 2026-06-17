import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import {
  IExpenseReadFilter,
  IExpenseRepositoryRead,
} from '../../../domain/expense/repository/expense.repository.read';
import { IExpense } from '../../../domain/expense/entity/interfaces/expense.interface';
import { ExpenseModel } from '../../db/mongo/models/expense.model';
import { dbToInternal } from './adapters/expense.adapter';

export class ExpenseRepositoryRead implements IExpenseRepositoryRead {
  async findExpenseById(id: string): Promise<IExpense | null> {
    try {
      const expense = await ExpenseModel.findOne({ id });
      return expense ? dbToInternal(expense) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ExpenseRepositoryRead.findExpenseById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async listExpenses(filter: IExpenseReadFilter): Promise<IExpense[]> {
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
      if (filter.from || filter.to) {
        query.dueDate = {};
        if (filter.from) {
          (query.dueDate as Record<string, Date>).$gte = filter.from;
        }
        if (filter.to) {
          (query.dueDate as Record<string, Date>).$lte = filter.to;
        }
      }

      const expenses = await ExpenseModel.find(query).sort({
        dueDate: -1,
        createdAt: -1,
      });
      return expenses.map(dbToInternal);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ExpenseRepositoryRead.listExpenses',
        eventData: { filter },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
