import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { EEmbeddingSourceType } from '../../../domain/rag/entity/enums/EEmbeddingSourceType';
import {
  IVectorSearchResult,
  IVectorStoreRepository,
  IVectorDocument,
  IVectorSearchFilter,
} from '../../../domain/rag/repository/vector-store.repository';
import { runPostgresQuery } from '../../db/postgres/postgres.client';

function formatVector(values: number[]): string {
  return `[${values.join(',')}]`;
}

export class PgVectorStoreRepository implements IVectorStoreRepository {
  async upsert(document: IVectorDocument, embedding: number[]): Promise<void> {
    try {
      await runPostgresQuery(
        `INSERT INTO financial_embeddings
          (id, user_id, source_type, source_id, content, metadata, reference_month, category, status, embedding, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector, $11, $12)
        ON CONFLICT (user_id, source_type, source_id)
        DO UPDATE SET
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          reference_month = EXCLUDED.reference_month,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          embedding = EXCLUDED.embedding,
          updated_at = EXCLUDED.updated_at`,
        [
          document.id,
          document.userId,
          document.sourceType,
          document.sourceId,
          document.content,
          document.metadata || {},
          document.referenceMonth ?? null,
          document.category ?? null,
          document.status ?? null,
          formatVector(embedding),
          document.createdAt,
          new Date(),
        ],
      );
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'PgVectorStoreRepository.upsert',
        eventData: {
          userId: document.userId,
          sourceType: document.sourceType,
          sourceId: document.sourceId,
        },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async search(
    userId: string,
    embedding: number[],
    limit: number,
    filter?: IVectorSearchFilter,
  ): Promise<IVectorSearchResult[]> {
    try {
      const conditions = ['user_id = $1'];
      const values: unknown[] = [userId, formatVector(embedding)];
      let paramIndex = 3;

      if (filter?.sourceType) {
        conditions.push(`source_type = $${paramIndex}`);
        values.push(filter.sourceType);
        paramIndex += 1;
      }
      if (filter?.referenceMonth) {
        conditions.push(`reference_month = $${paramIndex}`);
        values.push(filter.referenceMonth);
        paramIndex += 1;
      }
      if (filter?.category) {
        conditions.push(`category = $${paramIndex}`);
        values.push(filter.category);
        paramIndex += 1;
      }
      if (filter?.status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(filter.status);
        paramIndex += 1;
      }

      values.push(limit);
      const limitParam = `$${paramIndex}`;

      const result = await runPostgresQuery<{
        id: string;
        user_id: string;
        source_type: EEmbeddingSourceType;
        source_id: string;
        content: string;
        metadata: Record<string, unknown>;
        created_at: Date;
        score: number;
      }>(
        `SELECT
          id,
          user_id,
          source_type,
          source_id,
          content,
          metadata,
          created_at,
          (1 - (embedding <=> $2::vector))::float AS score
        FROM financial_embeddings
        WHERE ${conditions.join(' AND ')}
        ORDER BY embedding <=> $2::vector
        LIMIT ${limitParam}`,
        values,
      );

      return result.rows.map((row) => ({
        document: {
          id: row.id,
          userId: row.user_id,
          sourceType: row.source_type,
          sourceId: row.source_id,
          content: row.content,
          metadata: row.metadata || {},
          createdAt: new Date(row.created_at),
        },
        score: row.score,
      }));
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'PgVectorStoreRepository.search',
        eventData: { userId, limit },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async deleteBySource(
    userId: string,
    sourceType: EEmbeddingSourceType,
    sourceId: string,
  ): Promise<void> {
    try {
      await runPostgresQuery(
        `DELETE FROM financial_embeddings
         WHERE user_id = $1 AND source_type = $2 AND source_id = $3`,
        [userId, sourceType, sourceId],
      );
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'PgVectorStoreRepository.deleteBySource',
        eventData: { userId, sourceType, sourceId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
