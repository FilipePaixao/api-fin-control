import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EEmbeddingSourceType } from '../../../../domain/rag/entity/enums/EEmbeddingSourceType';
import { RagService } from '../../../../domain/rag/service/rag.service';
import {
  createEmbeddingProviderMock,
  createExpenseRepositoryReadMock,
  createVectorStoreRepositoryMock,
} from '../../helpers/service-mocks.helper';

describe('When asking financial question without question text', () => {
  it('Should reject with FIELD_INVALID', async () => {
    const service = new RagService({
      expenseRepositoryRead: createExpenseRepositoryReadMock(),
      vectorStoreRepository: createVectorStoreRepositoryMock(),
      embeddingProvider: createEmbeddingProviderMock(),
    });

    await expect(service.askFinancialQuestion('user-1', '   ')).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.FIELD_INVALID,
    });
  });
});

describe('When asking financial question without indexed context', () => {
  it('Should return fallback answer with empty sources', async () => {
    const service = new RagService({
      expenseRepositoryRead: createExpenseRepositoryReadMock(),
      vectorStoreRepository: createVectorStoreRepositoryMock({
        search: jest.fn().mockResolvedValue([]),
      }),
      embeddingProvider: createEmbeddingProviderMock({
        embed: jest.fn().mockResolvedValue([0.1, 0.2]),
      }),
    });

    const answer = await service.askFinancialQuestion('user-1', 'How much did I spend?');

    expect(answer.sources).toEqual([]);
    expect(answer.answer).toContain('could not find enough financial context');
  });
});

describe('When asking financial question with indexed context', () => {
  it('Should return contextual answer and sources', async () => {
    const service = new RagService({
      expenseRepositoryRead: createExpenseRepositoryReadMock(),
      vectorStoreRepository: createVectorStoreRepositoryMock({
        search: jest.fn().mockResolvedValue([
          {
            document: {
              id: 'vec-1',
              userId: 'user-1',
              sourceType: EEmbeddingSourceType.EXPENSE,
              sourceId: 'expense-1',
              content: 'Expense: Rent | Amount: 1800',
              createdAt: new Date(),
            },
            score: 0.91234,
          },
        ]),
      }),
      embeddingProvider: createEmbeddingProviderMock({
        embed: jest.fn().mockResolvedValue([0.1, 0.2]),
      }),
    });

    const answer = await service.askFinancialQuestion('user-1', 'What is my highest expense?');

    expect(answer.answer).toContain('Expense: Rent');
    expect(answer.sources).toEqual([
      expect.objectContaining({
        sourceType: EEmbeddingSourceType.EXPENSE,
        sourceId: 'expense-1',
        score: 0.9123,
      }),
    ]);
  });
});
