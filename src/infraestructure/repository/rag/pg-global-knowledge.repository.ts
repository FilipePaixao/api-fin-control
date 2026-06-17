import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import {
  IGlobalKnowledgeRepository,
  IGlobalKnowledgeSearchResult,
  IGlobalKnowledgeDocument,
} from '../../../domain/agent/repository/global-knowledge.repository';
import { runPostgresQuery } from '../../db/postgres/postgres.client';

function formatVector(values: number[]): string {
  return `[${values.join(',')}]`;
}

export class PgGlobalKnowledgeRepository implements IGlobalKnowledgeRepository {
  async upsert(document: IGlobalKnowledgeDocument, embedding: number[]): Promise<void> {
    try {
      await runPostgresQuery(
        `INSERT INTO global_knowledge_embeddings
          (id, source_type, content, metadata, embedding, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5::vector, $6, $7)
        ON CONFLICT (id)
        DO UPDATE SET
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          embedding = EXCLUDED.embedding,
          updated_at = EXCLUDED.updated_at`,
        [
          document.id,
          document.sourceType,
          document.content,
          document.metadata || {},
          formatVector(embedding),
          document.createdAt,
          new Date(),
        ],
      );
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'PgGlobalKnowledgeRepository.upsert',
        eventData: { sourceType: document.sourceType },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async search(embedding: number[], limit: number): Promise<IGlobalKnowledgeSearchResult[]> {
    try {
      const result = await runPostgresQuery<{
        id: string;
        source_type: string;
        content: string;
        metadata: Record<string, unknown>;
        created_at: Date;
        score: number;
      }>(
        `SELECT
          id,
          source_type,
          content,
          metadata,
          created_at,
          (1 - (embedding <=> $1::vector))::float AS score
        FROM global_knowledge_embeddings
        ORDER BY embedding <=> $1::vector
        LIMIT $2`,
        [formatVector(embedding), limit],
      );

      return result.rows.map((row) => ({
        document: {
          id: row.id,
          sourceType: row.source_type as IGlobalKnowledgeDocument['sourceType'],
          content: row.content,
          metadata: row.metadata,
          createdAt: row.created_at,
        },
        score: row.score,
      }));
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'PgGlobalKnowledgeRepository.search',
        eventData: { limit },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
