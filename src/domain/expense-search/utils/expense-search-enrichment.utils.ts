import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { IExpense } from '../../expense/entity/interfaces/expense.interface';

/** Category aliases indexed for lexical + semantic search enrichment. */
export const CATEGORY_SEARCH_ALIASES: Record<EExpenseCategory, string[]> = {
  [EExpenseCategory.HOUSING]: ['moradia', 'aluguel', 'housing', 'condominio', 'iptu'],
  [EExpenseCategory.FOOD]: ['alimentacao', 'comida', 'food', 'mercado', 'restaurante'],
  [EExpenseCategory.TRANSPORT]: [
    'transporte',
    'mobilidade',
    'uber',
    '99',
    'estacionamento',
    'ipva',
    'onibus',
    'metro',
  ],
  [EExpenseCategory.HEALTH]: ['saude', 'health', 'farmacia', 'medico', 'plano de saude'],
  [EExpenseCategory.EDUCATION]: ['educacao', 'education', 'curso', 'escola', 'faculdade'],
  [EExpenseCategory.ENTERTAINMENT]: ['lazer', 'entretenimento', 'cinema', 'viagem'],
  [EExpenseCategory.SUBSCRIPTIONS]: ['assinatura', 'assinaturas', 'subscription', 'streaming'],
  [EExpenseCategory.DEBT]: ['divida', 'dividas', 'emprestimo', 'financiamento'],
  [EExpenseCategory.INVESTMENT]: ['investimento', 'aplicacao', 'poupanca'],
  [EExpenseCategory.OTHER]: ['outros'],
};

const FUEL_MERCHANT_PATTERN =
  /\b(posto|combust|shell|ipiranga|petrobras|\bale\b|gasolina|fuel|auto\s*posto)\b/i;

/** Terms added when the merchant name/description looks like a fuel station. */
export const FUEL_SEARCH_TERMS = ['gasolina', 'combustivel', 'posto'] as const;

export function isFuelMerchant(text: string): boolean {
  return FUEL_MERCHANT_PATTERN.test(text);
}

export type ExpenseSearchEnrichmentInput = Pick<IExpense, 'name' | 'category'> & {
  description?: string;
};

/**
 * Builds a space-separated bag of search enrichment terms
 * (category aliases + fuel detection from merchant text).
 */
export function buildExpenseSearchTerms(expense: ExpenseSearchEnrichmentInput): string {
  const terms = new Set<string>();

  for (const alias of CATEGORY_SEARCH_ALIASES[expense.category] ?? []) {
    terms.add(alias.toLowerCase());
  }

  const merchantText = `${expense.name} ${expense.description ?? ''}`;
  if (isFuelMerchant(merchantText)) {
    for (const term of FUEL_SEARCH_TERMS) {
      terms.add(term);
    }
  }

  return Array.from(terms).join(' ');
}
