import { ExpenseSearchService } from '../../domain/expense-search/service/expense-search.service';
import { ExpenseRepositoryRead } from '../../infraestructure/repository/expense/expense.repository.read';
import { OpenSearchExpenseIndexRepository } from '../../infraestructure/repository/search/opensearch-expense-index.repository';
import { RagServiceFactory } from './rag.service.factory';

export class ExpenseSearchServiceFactory {
  static create(): ExpenseSearchService {
    return new ExpenseSearchService({
      expenseRepositoryRead: new ExpenseRepositoryRead(),
      expenseIndexRepository: new OpenSearchExpenseIndexRepository(),
      ragService: RagServiceFactory.create(),
    });
  }
}
