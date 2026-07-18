import { IncomeService } from '../../../../domain/income/service/income.service';
import { EIncomeCategory } from '../../../../domain/income/entity/enums/EIncomeCategory';
import { EIncomeStatus } from '../../../../domain/income/entity/enums/EIncomeStatus';
import {
  createIncomeRepositoryReadMock,
  createIncomeRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When creating income with valid payload', () => {
  it('Should create income using authenticated user id', async () => {
    const incomeRepositoryRead = createIncomeRepositoryReadMock();
    const incomeRepositoryWrite = createIncomeRepositoryWriteMock({
      createIncome: jest.fn().mockImplementation(async (income) => income),
    });
    const incomeService = new IncomeService({
      incomeRepositoryRead,
      incomeRepositoryWrite,
    });

    const result = await incomeService.createIncome('user-1', {
      userId: 'ignored',
      name: 'Salário CLT',
      amount: 8000,
      category: EIncomeCategory.SALARY,
      referenceMonth: '2026-06',
    });

    expect(result.userId).toBe('user-1');
    expect(result.status).toBe(EIncomeStatus.EXPECTED);
  });
});
