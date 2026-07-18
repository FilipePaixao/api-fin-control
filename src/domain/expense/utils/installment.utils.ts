export function splitInstallmentAmounts(totalAmount: number, totalInstallments: number): number[] {
  if (totalInstallments < 2) {
    throw new Error('Total installments must be at least 2');
  }
  if (totalAmount <= 0) {
    throw new Error('Total amount must be greater than zero');
  }

  const baseAmount = Math.floor((totalAmount * 100) / totalInstallments) / 100;
  const amounts = Array.from({ length: totalInstallments }, () => baseAmount);
  const distributed = baseAmount * totalInstallments;
  const remainder = Math.round((totalAmount - distributed) * 100) / 100;

  if (remainder !== 0) {
    amounts[totalInstallments - 1] =
      Math.round((amounts[totalInstallments - 1] + remainder) * 100) / 100;
  }

  return amounts;
}

export function buildInstallmentName(name: string, installmentNumber: number, totalInstallments: number): string {
  return `${name.trim()} (${installmentNumber}/${totalInstallments})`;
}
