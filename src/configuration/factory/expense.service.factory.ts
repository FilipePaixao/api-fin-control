import { ExpenseService } from '../../domain/expense/service/expense.service';
import { ExpenseRepositoryRead } from '../../infraestructure/repository/expense/expense.repository.read';
import { ExpenseRepositoryWrite } from '../../infraestructure/repository/expense/expense.repository.write';
import { OpenSearchExpenseIndexRepository } from '../../infraestructure/repository/search/opensearch-expense-index.repository';
import { ExpenseSearchServiceFactory } from './expense-search.service.factory';
import { RagServiceFactory } from './rag.service.factory';

export class ExpenseServiceFactory {
  static create(): ExpenseService {
    return new ExpenseService({
      expenseRepositoryRead: new ExpenseRepositoryRead(),
      expenseRepositoryWrite: new ExpenseRepositoryWrite(),
      expenseSearchService: ExpenseSearchServiceFactory.create(),
      expenseIndexRepository: new OpenSearchExpenseIndexRepository(),
      ragService: RagServiceFactory.create(),
    });
  }
}
