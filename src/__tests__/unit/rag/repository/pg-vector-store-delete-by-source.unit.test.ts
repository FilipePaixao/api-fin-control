import { EEmbeddingSourceType } from '../../../../domain/rag/entity/enums/EEmbeddingSourceType';
import { PgVectorStoreRepository } from '../../../../infraestructure/repository/rag/pg-vector-store.repository';

const runPostgresQueryMock = jest.fn();

jest.mock('../../../../infraestructure/db/postgres/postgres.client', () => ({
  runPostgresQuery: (...args: unknown[]) => runPostgresQueryMock(...args),
}));

describe('When deleting embedding by source on pg vector repository', () => {
  it('Should execute delete query with expected parameters', async () => {
    runPostgresQueryMock.mockReset();
    runPostgresQueryMock.mockResolvedValue({ rows: [] });
    const repository = new PgVectorStoreRepository();

    await repository.deleteBySource(
      'user-1',
      EEmbeddingSourceType.EXPENSE,
      'expense-1',
    );

    expect(runPostgresQueryMock).toHaveBeenCalledTimes(1);
    expect(runPostgresQueryMock).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'), [
      'user-1',
      EEmbeddingSourceType.EXPENSE,
      'expense-1',
    ]);
  });
});
