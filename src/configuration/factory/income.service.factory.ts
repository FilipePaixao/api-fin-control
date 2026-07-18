import { IncomeService } from '../../domain/income/service/income.service';
import { IncomeRepositoryRead } from '../../infraestructure/repository/income/income.repository.read';
import { IncomeRepositoryWrite } from '../../infraestructure/repository/income/income.repository.write';

export class IncomeServiceFactory {
  static create(): IncomeService {
    return new IncomeService({
      incomeRepositoryRead: new IncomeRepositoryRead(),
      incomeRepositoryWrite: new IncomeRepositoryWrite(),
    });
  }
}
