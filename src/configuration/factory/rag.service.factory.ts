import { RagService } from '../../domain/rag/service/rag.service';
import { ExpenseRepositoryRead } from '../../infraestructure/repository/expense/expense.repository.read';
import { PgVectorStoreRepository } from '../../infraestructure/repository/rag/pg-vector-store.repository';
import { MockEmbeddingProvider } from '../../infraestructure/rag/mock-embedding.provider';

export class RagServiceFactory {
  static create(): RagService {
    return new RagService({
      expenseRepositoryRead: new ExpenseRepositoryRead(),
      vectorStoreRepository: new PgVectorStoreRepository(),
      embeddingProvider: new MockEmbeddingProvider(),
    });
  }
}
