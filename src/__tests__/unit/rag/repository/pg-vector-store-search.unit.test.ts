import { EEmbeddingSourceType } from '../../../../domain/rag/entity/enums/EEmbeddingSourceType';
import { PgVectorStoreRepository } from '../../../../infraestructure/repository/rag/pg-vector-store.repository';

const runPostgresQueryMock = jest.fn();

jest.mock('../../../../infraestructure/db/postgres/postgres.client', () => ({
  runPostgresQuery: (...args: unknown[]) => runPostgresQueryMock(...args),
}));

describe('When searching embeddings on pg vector repository', () => {
  it('Should map rows to vector search result format', async () => {
    runPostgresQueryMock.mockReset();
    runPostgresQueryMock.mockResolvedValue({
      rows: [
        {
          id: 'vec-1',
          user_id: 'user-1',
          source_type: EEmbeddingSourceType.EXPENSE,
          source_id: 'expense-1',
          content: 'Expense Rent',
          metadata: {},
          created_at: new Date(),
          score: 0.87,
        },
      ],
    });

    const repository = new PgVectorStoreRepository();
    const result = await repository.search('user-1', [0.1, 0.2, 0.3], 3);

    expect(result).toHaveLength(1);
    expect(result[0].document.userId).toBe('user-1');
    expect(result[0].score).toBe(0.87);
  });
});
