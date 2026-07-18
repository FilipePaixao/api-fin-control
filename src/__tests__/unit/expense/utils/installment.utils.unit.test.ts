import { splitInstallmentAmounts, buildInstallmentName } from '../../../../domain/expense/utils/installment.utils';

describe('splitInstallmentAmounts', () => {
  it('Should split evenly when divisible', () => {
    expect(splitInstallmentAmounts(6000, 12)).toEqual(Array(12).fill(500));
  });

  it('Should put remainder on last installment', () => {
    expect(splitInstallmentAmounts(10, 3)).toEqual([3.33, 3.33, 3.34]);
  });

  it('Should throw when installments is less than 2', () => {
    expect(() => splitInstallmentAmounts(100, 1)).toThrow(
      'Total installments must be at least 2',
    );
  });
});

describe('buildInstallmentName', () => {
  it('Should format installment label', () => {
    expect(buildInstallmentName('Notebook', 3, 12)).toBe('Notebook (3/12)');
  });
});
