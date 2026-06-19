import { serviceLogErrorHandler, IThrowedError } from '@sauvvitech/st-packages';
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
import { toExpenseIndexDocument } from '../utils/expense-index-document.utils';

export class ExpenseService implements IExpenseService {
  private readonly expenseRepositoryRead: IParamsExpenseService['expenseRepositoryRead'];
  private readonly expenseRepositoryWrite: IParamsExpenseService['expenseRepositoryWrite'];
  private readonly expenseSearchService?: IParamsExpenseService['expenseSearchService'];
  private readonly expenseIndexRepository?: IParamsExpenseService['expenseIndexRepository'];
  private readonly ragService?: IParamsExpenseService['ragService'];

  constructor({
    expenseRepositoryRead,
    expenseRepositoryWrite,
    expenseSearchService,
    expenseIndexRepository,
    ragService,
  }: IParamsExpenseService) {
    this.expenseRepositoryRead = expenseRepositoryRead;
    this.expenseRepositoryWrite = expenseRepositoryWrite;
    this.expenseSearchService = expenseSearchService;
    this.expenseIndexRepository = expenseIndexRepository;
    this.ragService = ragService;
  }

  async createExpense(userId: string, payload: ICreateExpenseInput): Promise<IExpense> {
    const expenseEntity = new ExpenseServiceEntity({
      ...payload,
      userId,
    });
    const createdExpense = await this.expenseRepositoryWrite.createExpense(expenseEntity);
    this.scheduleExpenseIndexing(createdExpense);
    return createdExpense;
  }

  async listExpenses(userId: string, filters: IExpenseFilters): Promise<IExpense[]> {
    if (filters.search?.trim() && this.expenseSearchService) {
      return this.expenseSearchService.searchExpenses(userId, filters);
    }

    return this.expenseRepositoryRead.listExpenses({
      userId,
      category: filters.category,
      status: filters.status,
      referenceMonth: filters.referenceMonth,
      from: filters.from,
      to: filters.to,
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
    this.scheduleExpenseIndexing(updatedExpense);
    return updatedExpense;
  }

  async deleteExpenseById(userId: string, expenseId: string): Promise<void> {
    const expense = await this.expenseRepositoryRead.findExpenseById(expenseId);
    this.assertExpenseOwnershipOrNotFound(expense, userId, expenseId);
    await this.expenseRepositoryWrite.deleteExpenseById(expenseId);
    this.scheduleExpenseRemoval(userId, expenseId);
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
    this.scheduleExpenseIndexing(updatedExpense);
    return updatedExpense;
  }

  private scheduleExpenseIndexing(expense: IExpense): void {
    if (!this.expenseIndexRepository && !this.ragService) {
      return;
    }

    void Promise.all([
      this.expenseIndexRepository?.upsert(toExpenseIndexDocument(expense)),
      this.ragService?.syncExpense(expense.userId, expense),
    ]).catch((error) => {
      serviceLogErrorHandler(error, {
        eventName: 'ExpenseService.scheduleExpenseIndexing',
        eventData: { expenseId: expense.id, userId: expense.userId },
      });
    });
  }

  private scheduleExpenseRemoval(userId: string, expenseId: string): void {
    if (!this.expenseIndexRepository && !this.ragService) {
      return;
    }

    void Promise.all([
      this.expenseIndexRepository?.delete(userId, expenseId),
      this.ragService?.removeExpense(userId, expenseId),
    ]).catch((error) => {
      serviceLogErrorHandler(error, {
        eventName: 'ExpenseService.scheduleExpenseRemoval',
        eventData: { expenseId, userId },
      });
    });
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
