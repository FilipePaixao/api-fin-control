import { generateId } from '../../common/utils/generate-id';
import { EIncomeCategory } from './enums/EIncomeCategory';
import { EIncomeStatus } from './enums/EIncomeStatus';
import { ICreateIncomeInput, IIncome } from './interfaces/income.interface';

const REFERENCE_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export class IncomeServiceEntity implements IIncome {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: EIncomeCategory;
  referenceMonth: string;
  receivedAt?: Date;
  status: EIncomeStatus;
  source?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(income: IIncome | (ICreateIncomeInput & { id?: string })) {
    IncomeServiceEntity.validateIncomeInput(income);
    this.id = income.id || generateId();
    this.userId = income.userId;
    this.name = income.name.trim();
    this.amount = income.amount;
    this.category = income.category;
    this.referenceMonth = income.referenceMonth;
    this.receivedAt = income.receivedAt;
    this.status =
      'status' in income && income.status ? income.status : EIncomeStatus.EXPECTED;
    this.source = income.source?.trim();
    this.createdAt =
      'createdAt' in income && income.createdAt ? income.createdAt : new Date();
    this.updatedAt =
      'updatedAt' in income && income.updatedAt ? income.updatedAt : new Date();
  }

  static validateIncomeInput(
    income: Partial<IIncome> & {
      userId?: string;
      name?: string;
      amount?: number;
      category?: EIncomeCategory;
      referenceMonth?: string;
      status?: EIncomeStatus;
    },
  ): void {
    if (!income.userId?.trim()) {
      throw new Error('User ID is required');
    }
    if (!income.name?.trim()) {
      throw new Error('Income name is required');
    }
    if (income.amount === undefined || income.amount <= 0) {
      throw new Error('Income amount must be greater than zero');
    }
    if (
      income.category &&
      !Object.values(EIncomeCategory).includes(income.category)
    ) {
      throw new Error('Invalid income category');
    }
    if (income.status && !Object.values(EIncomeStatus).includes(income.status)) {
      throw new Error('Invalid income status');
    }
    if (
      income.referenceMonth &&
      !REFERENCE_MONTH_REGEX.test(income.referenceMonth)
    ) {
      throw new Error('Reference month must be in YYYY-MM format');
    }
  }
}
