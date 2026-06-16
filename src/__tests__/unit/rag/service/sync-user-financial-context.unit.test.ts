import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { EEmbeddingSourceType } from '../../../../domain/rag/entity/enums/EEmbeddingSourceType';
import { RagService } from '../../../../domain/rag/service/rag.service';
import {
  createEmbeddingProviderMock,
  createExpenseRepositoryReadMock,
  createVectorStoreRepositoryMock,
} from '../../helpers/service-mocks.helper';

describe('When syncing user financial context with existing expenses', () => {
  it('Should generate embeddings and upsert one document per expense', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpenses: jest.fn().mockResolvedValue([
        {
          id: 'expense-1',
          userId: 'user-1',
          name: 'Rent',
          amount: 1800,
          category: EExpenseCategory.HOUSING,
          status: EExpenseStatus.PENDING,
          referenceMonth: '2026-06',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    });
    const embeddingProvider = createEmbeddingProviderMock({
      embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    });
    const vectorStoreRepository = createVectorStoreRepositoryMock({
      upsert: jest.fn().mockResolvedValue(undefined),
    });

    const service = new RagService({
      expenseRepositoryRead,
      vectorStoreRepository,
      embeddingProvider,
    });

    await service.syncUserFinancialContext('user-1');

    expect(expenseRepositoryRead.listExpenses).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(embeddingProvider.embed).toHaveBeenCalledTimes(1);
    expect(vectorStoreRepository.upsert).toHaveBeenCalledTimes(1);
    expect(vectorStoreRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        sourceType: EEmbeddingSourceType.EXPENSE,
        sourceId: 'expense-1',
      }),
      [0.1, 0.2, 0.3],
    );
  });
});

describe('When syncing user financial context without expenses', () => {
  it('Should not call embedding provider or vector store', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpenses: jest.fn().mockResolvedValue([]),
    });
    const embeddingProvider = createEmbeddingProviderMock({
      embed: jest.fn(),
    });
    const vectorStoreRepository = createVectorStoreRepositoryMock({
      upsert: jest.fn(),
    });

    const service = new RagService({
      expenseRepositoryRead,
      vectorStoreRepository,
      embeddingProvider,
    });

    await service.syncUserFinancialContext('user-1');

    expect(embeddingProvider.embed).not.toHaveBeenCalled();
    expect(vectorStoreRepository.upsert).not.toHaveBeenCalled();
  });
});
