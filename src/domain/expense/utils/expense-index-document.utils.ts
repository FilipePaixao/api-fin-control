import { IExpense } from '../entity/interfaces/expense.interface';
import { getExpenseCategoryLabel } from '../utils/expense-labels.utils';
import { IExpenseIndexDocument } from '../../expense-search/interfaces/expense-index.repository';
import { buildExpenseSearchTerms } from '../../expense-search/utils/expense-search-enrichment.utils';

export function toExpenseIndexDocument(expense: IExpense): IExpenseIndexDocument {
  return {
    userId: expense.userId,
    expenseId: expense.id,
    name: expense.name,
    description: expense.description,
    category: expense.category,
    categoryLabel: getExpenseCategoryLabel(expense.category),
    searchTerms: buildExpenseSearchTerms(expense),
    status: expense.status,
    referenceMonth: expense.referenceMonth,
  };
}
