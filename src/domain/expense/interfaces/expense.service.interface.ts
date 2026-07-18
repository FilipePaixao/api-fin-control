import { EExpenseCategory } from '../entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../entity/enums/EExpenseStatus';
import { EPaymentMethod } from '../entity/enums/EPaymentMethod';
import { ICreateExpenseInput, ICreateInstallmentExpenseInput, IExpense } from '../entity/interfaces/expense.interface';
import { IExpenseRepositoryRead } from '../repository/expense.repository.read';
import { IExpenseRepositoryWrite } from '../repository/expense.repository.write';
import { IExpenseIndexRepository } from '../../expense-search/interfaces/expense-index.repository';
import { IExpenseSearchService } from '../../expense-search/interfaces/expense-search.service.interface';
import { IRagService } from '../../rag/interfaces/rag.service.interface';

export interface IExpenseFilters {
  category?: EExpenseCategory;
  status?: EExpenseStatus;
  referenceMonth?: string;
  from?: Date;
  to?: Date;
  search?: string;
  installmentGroupId?: string;
}

export interface IUpdateExpenseInput {
  name?: string;
  description?: string;
  amount?: number;
  category?: EExpenseCategory;
  paymentMethod?: EPaymentMethod;
  status?: EExpenseStatus;
  dueDate?: Date;
  referenceMonth?: string;
}

export interface IPayExpenseInput {
  paidAt?: Date;
  paymentMethod?: EPaymentMethod;
}

export interface IParamsExpenseService {
  expenseRepositoryRead: IExpenseRepositoryRead;
  expenseRepositoryWrite: IExpenseRepositoryWrite;
  expenseSearchService?: IExpenseSearchService;
  expenseIndexRepository?: IExpenseIndexRepository;
  ragService?: IRagService;
}

export interface IExpenseService {
  createExpense(userId: string, payload: ICreateExpenseInput): Promise<IExpense>;
  listExpenses(userId: string, filters: IExpenseFilters): Promise<IExpense[]>;
  getExpenseById(userId: string, expenseId: string): Promise<IExpense>;
  updateExpenseById(
    userId: string,
    expenseId: string,
    payload: IUpdateExpenseInput,
  ): Promise<IExpense>;
  deleteExpenseById(userId: string, expenseId: string): Promise<void>;
  payExpenseById(
    userId: string,
    expenseId: string,
    payload: IPayExpenseInput,
  ): Promise<IExpense>;
  createInstallmentExpenses(
    userId: string,
    payload: ICreateInstallmentExpenseInput,
  ): Promise<IExpense[]>;
  deleteInstallmentGroup(userId: string, installmentGroupId: string): Promise<void>;
}
