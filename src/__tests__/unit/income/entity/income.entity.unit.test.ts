import { IncomeServiceEntity } from '../../../../domain/income/entity/income.entity';
import { EIncomeCategory } from '../../../../domain/income/entity/enums/EIncomeCategory';
import { EIncomeStatus } from '../../../../domain/income/entity/enums/EIncomeStatus';

describe('IncomeServiceEntity', () => {
  it('Should create valid income entity', () => {
    const entity = new IncomeServiceEntity({
      userId: 'user-1',
      name: 'Salário CLT',
      amount: 5000,
      category: EIncomeCategory.SALARY,
      referenceMonth: '2026-06',
    });

    expect(entity.status).toBe(EIncomeStatus.EXPECTED);
    expect(entity.name).toBe('Salário CLT');
  });

  it('Should reject invalid amount', () => {
    expect(() =>
      new IncomeServiceEntity({
        userId: 'user-1',
        name: 'Invalid',
        amount: 0,
        category: EIncomeCategory.SALARY,
        referenceMonth: '2026-06',
      }),
    ).toThrow('Income amount must be greater than zero');
  });
});
