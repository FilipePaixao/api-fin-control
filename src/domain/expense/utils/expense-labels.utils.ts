import { EExpenseCategory } from '../entity/enums/EExpenseCategory';
import { EPaymentMethod } from '../entity/enums/EPaymentMethod';
import { EExpenseStatus } from '../entity/enums/EExpenseStatus';

export const EXPENSE_CATEGORY_LABELS: Record<EExpenseCategory, string> = {
  [EExpenseCategory.HOUSING]: 'Moradia',
  [EExpenseCategory.FOOD]: 'Alimentação',
  [EExpenseCategory.TRANSPORT]: 'Transporte',
  [EExpenseCategory.HEALTH]: 'Saúde',
  [EExpenseCategory.EDUCATION]: 'Educação',
  [EExpenseCategory.ENTERTAINMENT]: 'Lazer',
  [EExpenseCategory.SUBSCRIPTIONS]: 'Assinaturas',
  [EExpenseCategory.DEBT]: 'Dívidas',
  [EExpenseCategory.INVESTMENT]: 'Investimentos',
  [EExpenseCategory.OTHER]: 'Outros',
};

export const EXPENSE_STATUS_LABELS: Record<EExpenseStatus, string> = {
  [EExpenseStatus.PENDING]: 'Pendente',
  [EExpenseStatus.PAID]: 'Pago',
  [EExpenseStatus.OVERDUE]: 'Atrasado',
  [EExpenseStatus.CANCELED]: 'Cancelado',
};

export const PAYMENT_METHOD_LABELS: Record<EPaymentMethod, string> = {
  [EPaymentMethod.CREDIT_CARD]: 'Cartão de crédito',
  [EPaymentMethod.DEBIT_CARD]: 'Cartão de débito',
  [EPaymentMethod.PIX]: 'PIX',
  [EPaymentMethod.CASH]: 'Dinheiro',
  [EPaymentMethod.BANK_SLIP]: 'Boleto',
  [EPaymentMethod.BANK_TRANSFER]: 'Transferência',
  [EPaymentMethod.OTHER]: 'Outro',
};

export function getExpenseCategoryLabel(category: EExpenseCategory): string {
  return EXPENSE_CATEGORY_LABELS[category];
}

export function getExpenseStatusLabel(status: EExpenseStatus): string {
  return EXPENSE_STATUS_LABELS[status];
}

export function getPaymentMethodLabel(paymentMethod: EPaymentMethod): string {
  return PAYMENT_METHOD_LABELS[paymentMethod];
}
