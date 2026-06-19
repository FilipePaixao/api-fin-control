import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { EEmbeddingSourceType } from '../../../../domain/rag/entity/enums/EEmbeddingSourceType';
import { RagService } from '../../../../domain/rag/service/rag.service';
import {
  createEmbeddingProviderMock,
  createVectorStoreRepositoryMock,
} from '../../helpers/service-mocks.helper';

describe('When syncing a single expense', () => {
  it('Should generate embedding and upsert vector document', async () => {
    const embeddingProvider = createEmbeddingProviderMock({
      embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    });
    const vectorStoreRepository = createVectorStoreRepositoryMock({
      upsert: jest.fn().mockResolvedValue(undefined),
    });

    const service = new RagService({
      expenseRepositoryRead: {
        findExpenseById: jest.fn(),
        findExpensesByIds: jest.fn(),
        listExpenses: jest.fn(),
      },
      vectorStoreRepository,
      embeddingProvider,
    });

    await service.syncExpense('user-1', {
      id: 'expense-1',
      userId: 'user-1',
      name: 'Netflix',
      amount: 55,
      category: EExpenseCategory.SUBSCRIPTIONS,
      status: EExpenseStatus.PENDING,
      referenceMonth: '2026-06',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(embeddingProvider.embed).toHaveBeenCalledTimes(1);
    expect(vectorStoreRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        sourceType: EEmbeddingSourceType.EXPENSE,
        sourceId: 'expense-1',
        referenceMonth: '2026-06',
        category: EExpenseCategory.SUBSCRIPTIONS,
        status: EExpenseStatus.PENDING,
      }),
      [0.1, 0.2, 0.3],
    );
  });
});
