import { CreditCardService } from '../../domain/credit-card/service/credit-card.service';
import { CreditCardRepositoryRead } from '../../infraestructure/repository/credit-card/credit-card.repository.read';
import { CreditCardRepositoryWrite } from '../../infraestructure/repository/credit-card/credit-card.repository.write';
import { ExpenseServiceFactory } from './expense.service.factory';

export class CreditCardServiceFactory {
  static create(): CreditCardService {
    return new CreditCardService({
      creditCardRepositoryRead: new CreditCardRepositoryRead(),
      creditCardRepositoryWrite: new CreditCardRepositoryWrite(),
      expenseService: ExpenseServiceFactory.create(),
    });
  }
}
