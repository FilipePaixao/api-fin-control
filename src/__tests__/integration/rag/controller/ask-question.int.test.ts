const runPostgresQueryMock = jest.fn();

jest.mock('../../../../infraestructure/db/postgres/postgres.client', () => ({
  runPostgresQuery: (...args: unknown[]) => runPostgresQueryMock(...args),
}));

import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EEmbeddingSourceType } from '../../../../domain/rag/entity/enums/EEmbeddingSourceType';
import { createAuthenticatedUser } from '../../helpers/auth.helper';

describe('When asking rag question with authenticated user', () => {
  it('Should return answer based on vector search context', async () => {
    runPostgresQueryMock.mockReset();
    runPostgresQueryMock.mockResolvedValue({
      rows: [
        {
          id: 'vec-1',
          user_id: 'user-1',
          source_type: EEmbeddingSourceType.EXPENSE,
          source_id: 'expense-1',
          content: 'Expense: Rent | Amount: 1800',
          metadata: {},
          created_at: new Date(),
          score: 0.91,
        },
      ],
    });

    const { token } = await createAuthenticatedUser();

    const { body, statusCode } = await supertest(app.app)
      .post('/api/rag/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'What is my largest expense?' });

    expect(statusCode).toBe(200);
    expect(body.answer).toContain('Expense: Rent');
    expect(body.sources).toHaveLength(1);
    expect(body.sources[0]).toMatchObject({
      sourceType: EEmbeddingSourceType.EXPENSE,
      sourceId: 'expense-1',
    });
  });
});

describe('When asking rag question with invalid payload', () => {
  it('Should return bad request status', async () => {
    runPostgresQueryMock.mockReset();
    const { token } = await createAuthenticatedUser();

    const { statusCode } = await supertest(app.app)
      .post('/api/rag/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: ' ' });

    expect(statusCode).toBe(400);
  });
});
