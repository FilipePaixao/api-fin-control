import { ExpenseService } from '../../domain/expense/service/expense.service';
import { ExpenseRepositoryRead } from '../../infraestructure/repository/expense/expense.repository.read';
import { ExpenseRepositoryWrite } from '../../infraestructure/repository/expense/expense.repository.write';

export class ExpenseServiceFactory {
  static create(): ExpenseService {
    return new ExpenseService({
      expenseRepositoryRead: new ExpenseRepositoryRead(),
      expenseRepositoryWrite: new ExpenseRepositoryWrite(),
    });
  }
}
