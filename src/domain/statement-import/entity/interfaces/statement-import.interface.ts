import { EExpenseCategory } from '../../../expense/entity/enums/EExpenseCategory';
import { EPaymentMethod } from '../../../expense/entity/enums/EPaymentMethod';
import { EIncomeCategory } from '../../../income/entity/enums/EIncomeCategory';
import {
  EImportDocumentType,
  EImportTransactionKind,
} from '../enums/EImportDocumentType';

export interface IImportedTransaction {
  tempId: string;
  kind: EImportTransactionKind;
  name: string;
  originalName?: string;
  description?: string;
  amount: number;
  date: string;
  referenceMonth: string;
  category: string;
  paymentMethod?: EPaymentMethod;
  confidence?: number;
  suggestedSkip: boolean;
  duplicate: boolean;
  selected: boolean;
}

export interface IAnalyzeImportResult {
  documentType: EImportDocumentType;
  transactions: IImportedTransaction[];
  warnings: string[];
}

export interface IConfirmImportInput {
  documentType: EImportDocumentType;
  creditCardId?: string;
  transactions: Array<{
    kind: EImportTransactionKind;
    name: string;
    description?: string;
    amount: number;
    date: string;
    referenceMonth: string;
    category: string;
    paymentMethod?: EPaymentMethod;
    selected?: boolean;
  }>;
}

export interface IConfirmImportResult {
  expenses: unknown[];
  incomes: unknown[];
  skippedDuplicates: number;
}

export type ExpenseCategoryHint = {
  name: string;
  category: EExpenseCategory;
};

export type IncomeCategoryHint = {
  name: string;
  category: EIncomeCategory;
};
