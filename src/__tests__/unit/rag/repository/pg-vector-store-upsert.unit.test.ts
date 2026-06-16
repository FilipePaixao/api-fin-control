import { EEmbeddingSourceType } from '../../../../domain/rag/entity/enums/EEmbeddingSourceType';
import { PgVectorStoreRepository } from '../../../../infraestructure/repository/rag/pg-vector-store.repository';

const runPostgresQueryMock = jest.fn();

jest.mock('../../../../infraestructure/db/postgres/postgres.client', () => ({
  runPostgresQuery: (...args: unknown[]) => runPostgresQueryMock(...args),
}));

describe('When upserting embedding document on pg vector repository', () => {
  it('Should execute postgres query once', async () => {
    runPostgresQueryMock.mockReset();
    runPostgresQueryMock.mockResolvedValue({ rows: [] });
    const repository = new PgVectorStoreRepository();

    await repository.upsert(
      {
        id: 'vec-1',
        userId: 'user-1',
        sourceType: EEmbeddingSourceType.EXPENSE,
        sourceId: 'expense-1',
        content: 'Expense Rent',
        createdAt: new Date(),
      },
      [0.1, 0.2, 0.3],
    );

    expect(runPostgresQueryMock).toHaveBeenCalledTimes(1);
  });
});
