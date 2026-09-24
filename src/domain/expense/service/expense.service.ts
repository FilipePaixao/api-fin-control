import { serviceLogErrorHandler, IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { addMonthsToDate, addMonthsToReferenceMonth } from '../../common/utils/reference-month';
import { generateId } from '../../common/utils/generate-id';
import { EExpenseStatus } from '../entity/enums/EExpenseStatus';
import { ExpenseServiceEntity } from '../entity/expense.entity';
import {
  IExpenseFilters,
  IExpenseService,
  IParamsExpenseService,
  IPayExpenseInput,
  IUpdateExpenseInput,
} from '../interfaces/expense.service.interface';
import {
  ICreateExpenseInput,
  ICreateInstallmentExpenseInput,
  IExpense,
} from '../entity/interfaces/expense.interface';
import { toExpenseIndexDocument } from '../utils/expense-index-document.utils';
import { buildInstallmentName, splitInstallmentAmounts } from '../utils/installment.utils';
import { resolveExpenseStatus, resolveExpensesStatus } from '../utils/expense-status.utils';

export class ExpenseService implements IExpenseService {
  private readonly expenseRepositoryRead: IParamsExpenseService['expenseRepositoryRead'];
  private readonly expenseRepositoryWrite: IParamsExpenseService['expenseRepositoryWrite'];
  private readonly creditCardRepositoryRead?: IParamsExpenseService['creditCardRepositoryRead'];
  private readonly expenseSearchService?: IParamsExpenseService['expenseSearchService'];
  private readonly expenseIndexRepository?: IParamsExpenseService['expenseIndexRepository'];
  private readonly ragService?: IParamsExpenseService['ragService'];

  constructor({
    expenseRepositoryRead,
    expenseRepositoryWrite,
    creditCardRepositoryRead,
    expenseSearchService,
    expenseIndexRepository,
    ragService,
  }: IParamsExpenseService) {
    this.expenseRepositoryRead = expenseRepositoryRead;
    this.expenseRepositoryWrite = expenseRepositoryWrite;
    this.creditCardRepositoryRead = creditCardRepositoryRead;
    this.expenseSearchService = expenseSearchService;
    this.expenseIndexRepository = expenseIndexRepository;
    this.ragService = ragService;
  }

  async createExpense(userId: string, payload: ICreateExpenseInput): Promise<IExpense> {
    const creditCardId = await this.resolveCreditCardId(userId, payload.creditCardId);
    const expenseEntity = new ExpenseServiceEntity({
      ...payload,
      userId,
      creditCardId,
    });
    const createdExpense = await this.expenseRepositoryWrite.createExpense(expenseEntity);
    this.scheduleExpenseIndexing(createdExpense);
    return createdExpense;
  }

  async createManyExpenses(
    userId: string,
    payloads: ICreateExpenseInput[],
  ): Promise<IExpense[]> {
    if (!payloads.length) {
      return [];
    }

    const expenses = [];
    for (const payload of payloads) {
      const creditCardId = await this.resolveCreditCardId(userId, payload.creditCardId);
      expenses.push(
        new ExpenseServiceEntity({
          ...payload,
          userId,
          creditCardId,
        }),
      );
    }
    const createdExpenses = await this.expenseRepositoryWrite.createManyExpenses(expenses);
    createdExpenses.forEach((expense) => this.scheduleExpenseIndexing(expense));
    return createdExpenses;
  }

  async listExpenses(userId: string, filters: IExpenseFilters): Promise<IExpense[]> {
    const statusFilter =
      filters.status === EExpenseStatus.OVERDUE || filters.status === EExpenseStatus.PENDING
        ? undefined
        : filters.status;

    const repositoryFilters = {
      userId,
      category: filters.category,
      status: statusFilter,
      referenceMonth: filters.referenceMonth,
      from: filters.from,
      to: filters.to,
      installmentGroupId: filters.installmentGroupId,
      creditCardId: filters.creditCardId,
    };

    let expenses: IExpense[];
    if (filters.search?.trim() && this.expenseSearchService) {
      expenses = await this.expenseSearchService.searchExpenses(userId, {
        ...filters,
        status: statusFilter,
      });
    } else {
      expenses = await this.expenseRepositoryRead.listExpenses(repositoryFilters);
    }

    const resolved = resolveExpensesStatus(expenses);

    if (filters.status === EExpenseStatus.PENDING) {
      return resolved.filter((expense) => expense.status === EExpenseStatus.PENDING);
    }
    if (filters.status === EExpenseStatus.OVERDUE) {
      return resolved.filter((expense) => expense.status === EExpenseStatus.OVERDUE);
    }
    return resolved;
  }

  async createInstallmentExpenses(
    userId: string,
    payload: ICreateInstallmentExpenseInput,
  ): Promise<IExpense[]> {
    if (payload.totalInstallments < 2 || payload.totalInstallments > 60) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Total installments must be between 2 and 60',
      } as IThrowedError;
    }

    const creditCardId = await this.resolveCreditCardId(userId, payload.creditCardId);
    const installmentGroupId = generateId();
    const amounts = splitInstallmentAmounts(payload.totalAmount, payload.totalInstallments);
    const expenses: IExpense[] = [];

    for (let index = 0; index < payload.totalInstallments; index += 1) {
      const installmentNumber = index + 1;
      const referenceMonth = addMonthsToReferenceMonth(payload.referenceMonth, index);
      const dueDate = payload.dueDate
        ? addMonthsToDate(payload.dueDate, index)
        : undefined;

      const expenseEntity = new ExpenseServiceEntity({
        userId,
        name: buildInstallmentName(
          payload.name,
          installmentNumber,
          payload.totalInstallments,
        ),
        description: payload.description,
        amount: amounts[index],
        category: payload.category,
        paymentMethod: payload.paymentMethod,
        dueDate,
        referenceMonth,
        installmentGroupId,
        installmentNumber,
        totalInstallments: payload.totalInstallments,
        totalAmount: payload.totalAmount,
        creditCardId,
      });
      expenses.push(expenseEntity);
    }

    const createdExpenses = await this.expenseRepositoryWrite.createManyExpenses(expenses);
    createdExpenses.forEach((expense) => this.scheduleExpenseIndexing(expense));
    return createdExpenses;
  }

  async deleteInstallmentGroup(userId: string, installmentGroupId: string): Promise<void> {
    const expenses = await this.expenseRepositoryRead.listExpensesByInstallmentGroupId(
      userId,
      installmentGroupId,
    );

    if (!expenses.length) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'Installment group not found',
        details: { installmentGroupId },
      } as IThrowedError;
    }

    const expenseIds = expenses.map((expense) => expense.id);
    await this.expenseRepositoryWrite.deleteExpensesByIds(expenseIds);
    expenseIds.forEach((expenseId) => this.scheduleExpenseRemoval(userId, expenseId));
  }

  async getExpenseById(userId: string, expenseId: string): Promise<IExpense> {
    const expense = await this.expenseRepositoryRead.findExpenseById(expenseId);
    this.assertExpenseOwnershipOrNotFound(expense, userId, expenseId);
    return resolveExpenseStatus(expense);
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

    const updatePayload: IUpdateExpenseInput & { updatedAt: Date } = {
      ...payload,
      updatedAt: new Date(),
    };

    if (payload.creditCardId !== undefined) {
      updatePayload.creditCardId = await this.resolveCreditCardId(userId, payload.creditCardId);
    }

    const mergedExpense = {
      ...currentExpense,
      ...updatePayload,
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
      updatePayload,
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

  private async resolveCreditCardId(
    userId: string,
    creditCardId?: string | null,
  ): Promise<string | undefined> {
    if (creditCardId === undefined || creditCardId === null) {
      return undefined;
    }

    const trimmed = String(creditCardId).trim();
    if (!trimmed) {
      return undefined;
    }

    if (!this.creditCardRepositoryRead) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Credit card validation is unavailable',
        details: { creditCardId: trimmed },
      } as IThrowedError;
    }

    const card = await this.creditCardRepositoryRead.findById(trimmed);
    if (!card || card.userId !== userId) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'Credit card not found',
        details: { creditCardId: trimmed },
      } as IThrowedError;
    }

    return card.id;
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
