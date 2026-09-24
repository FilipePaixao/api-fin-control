import { IExpense } from '../../expense/entity/interfaces/expense.interface';
import {
  getExpenseCategoryLabel,
  getExpenseStatusLabel,
  getPaymentMethodLabel,
} from '../../expense/utils/expense-labels.utils';
import { buildExpenseSearchTerms } from '../../expense-search/utils/expense-search-enrichment.utils';

function formatDatePtBr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildExpenseRagContent(expense: IExpense): string {
  const searchTerms = buildExpenseSearchTerms(expense);
  const parts = [
    `Despesa: ${expense.name}`,
    expense.description ? `Descrição: ${expense.description}` : null,
    `Valor: R$ ${expense.amount.toFixed(2)}`,
    `Categoria: ${getExpenseCategoryLabel(expense.category)}`,
    searchTerms ? `Termos de busca: ${searchTerms}` : null,
    `Status: ${getExpenseStatusLabel(expense.status)}`,
    `Mês de referência: ${expense.referenceMonth}`,
    expense.dueDate ? `Vencimento: ${formatDatePtBr(expense.dueDate)}` : null,
    expense.paymentMethod
      ? `Forma de pagamento: ${getPaymentMethodLabel(expense.paymentMethod)}`
      : null,
  ];

  return parts.filter(Boolean).join(' | ');
}
