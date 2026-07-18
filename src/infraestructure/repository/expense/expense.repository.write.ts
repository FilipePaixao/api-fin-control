import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { IExpense } from '../../../domain/expense/entity/interfaces/expense.interface';
import { IExpenseRepositoryWrite } from '../../../domain/expense/repository/expense.repository.write';
import { ExpenseModel } from '../../db/mongo/models/expense.model';
import { dbToInternal, internalToDb } from './adapters/expense.adapter';

export class ExpenseRepositoryWrite implements IExpenseRepositoryWrite {
  async createExpense(expense: IExpense): Promise<IExpense> {
    try {
      const createdExpense = await ExpenseModel.create(internalToDb(expense));
      return dbToInternal(createdExpense);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ExpenseRepositoryWrite.createExpense',
        eventData: { expenseId: expense.id, userId: expense.userId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async createManyExpenses(expenses: IExpense[]): Promise<IExpense[]> {
    try {
      const createdExpenses = await ExpenseModel.insertMany(
        expenses.map((expense) => internalToDb(expense)),
      );
      return createdExpenses.map(dbToInternal);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ExpenseRepositoryWrite.createManyExpenses',
        eventData: { count: expenses.length },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async updateExpenseById(
    id: string,
    payload: Partial<IExpense>,
  ): Promise<IExpense | null> {
    try {
      const updatedExpense = await ExpenseModel.findOneAndUpdate(
        { id },
        { $set: payload },
        { new: true },
      );
      return updatedExpense ? dbToInternal(updatedExpense) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ExpenseRepositoryWrite.updateExpenseById',
        eventData: { id, payload },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async deleteExpenseById(id: string): Promise<IExpense | null> {
    try {
      const deletedExpense = await ExpenseModel.findOneAndDelete({ id });
      return deletedExpense ? dbToInternal(deletedExpense) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ExpenseRepositoryWrite.deleteExpenseById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async deleteExpensesByIds(ids: string[]): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    try {
      const result = await ExpenseModel.deleteMany({ id: { $in: ids } });
      return result.deletedCount ?? 0;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ExpenseRepositoryWrite.deleteExpensesByIds',
        eventData: { ids },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
