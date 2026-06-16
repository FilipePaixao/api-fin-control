import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { EExpenseStatus } from '../entity/enums/EExpenseStatus';
import { ExpenseServiceEntity } from '../entity/expense.entity';
import {
  IExpenseFilters,
  IExpenseService,
  IParamsExpenseService,
  IPayExpenseInput,
  IUpdateExpenseInput,
} from '../interfaces/expense.service.interface';
import { ICreateExpenseInput, IExpense } from '../entity/interfaces/expense.interface';

export class ExpenseService implements IExpenseService {
  private readonly expenseRepositoryRead: IParamsExpenseService['expenseRepositoryRead'];
  private readonly expenseRepositoryWrite: IParamsExpenseService['expenseRepositoryWrite'];

  constructor({ expenseRepositoryRead, expenseRepositoryWrite }: IParamsExpenseService) {
    this.expenseRepositoryRead = expenseRepositoryRead;
    this.expenseRepositoryWrite = expenseRepositoryWrite;
  }

  async createExpense(userId: string, payload: ICreateExpenseInput): Promise<IExpense> {
    const expenseEntity = new ExpenseServiceEntity({
      ...payload,
      userId,
    });
    return this.expenseRepositoryWrite.createExpense(expenseEntity);
  }

  async listExpenses(userId: string, filters: IExpenseFilters): Promise<IExpense[]> {
    return this.expenseRepositoryRead.listExpenses({
      userId,
      ...filters,
    });
  }

  async getExpenseById(userId: string, expenseId: string): Promise<IExpense> {
    const expense = await this.expenseRepositoryRead.findExpenseById(expenseId);
    this.assertExpenseOwnershipOrNotFound(expense, userId, expenseId);
    return expense;
  }

  async updateExpenseById(
    userId: string,
    expenseId: string,
    payload: IUpdateExpenseInput,
  ): Promise<IExpense> {
    const currentExpense = await this.expenseRepositoryRead.findExpenseById(expenseId);
    this.assertExpenseOwnershipOrNotFound(currentExpense, userId, expenseId);

    if (payload.amount !== undefined && payload.amount <= 0) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Expense amount must be greater than zero',
      } as IThrowedError;
    }

    const mergedExpense = {
      ...currentExpense,
      ...payload,
      updatedAt: new Date(),
    };

    try {
      ExpenseServiceEntity.validateExpenseInput(mergedExpense);
    } catch (error) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid expense payload',
      } as IThrowedError;
    }

    const updatedExpense = await this.expenseRepositoryWrite.updateExpenseById(
      expenseId,
      {
        ...payload,
        updatedAt: new Date(),
      },
    );
    this.assertExpenseOwnershipOrNotFound(updatedExpense, userId, expenseId);
    return updatedExpense;
  }

  async deleteExpenseById(userId: string, expenseId: string): Promise<void> {
    const expense = await this.expenseRepositoryRead.findExpenseById(expenseId);
    this.assertExpenseOwnershipOrNotFound(expense, userId, expenseId);
    await this.expenseRepositoryWrite.deleteExpenseById(expenseId);
  }

  async payExpenseById(
    userId: string,
    expenseId: string,
    payload: IPayExpenseInput,
  ): Promise<IExpense> {
    const expense = await this.expenseRepositoryRead.findExpenseById(expenseId);
    this.assertExpenseOwnershipOrNotFound(expense, userId, expenseId);

    const updatedExpense = await this.expenseRepositoryWrite.updateExpenseById(
      expenseId,
      {
        status: EExpenseStatus.PAID,
        paidAt: payload.paidAt || new Date(),
        paymentMethod: payload.paymentMethod || expense.paymentMethod,
        updatedAt: new Date(),
      },
    );
    this.assertExpenseOwnershipOrNotFound(updatedExpense, userId, expenseId);
    return updatedExpense;
  }

  private assertExpenseOwnershipOrNotFound(
    expense: IExpense | null,
    userId: string,
    expenseId: string,
  ): asserts expense is IExpense {
    if (!expense || expense.userId !== userId) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'Expense not found',
        details: { expenseId },
      } as IThrowedError;
    }
  }
}
