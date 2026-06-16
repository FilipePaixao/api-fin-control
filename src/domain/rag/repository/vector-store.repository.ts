import { EEmbeddingSourceType } from '../entity/enums/EEmbeddingSourceType';

export interface IVectorDocument {
  id: string;
  userId: string;
  sourceType: EEmbeddingSourceType;
  sourceId: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IVectorSearchResult {
  document: IVectorDocument;
  score: number;
}

export interface IVectorStoreRepository {
  upsert(document: IVectorDocument, embedding: number[]): Promise<void>;
  search(
    userId: string,
    embedding: number[],
    limit: number,
  ): Promise<IVectorSearchResult[]>;
  deleteBySource(
    userId: string,
    sourceType: EEmbeddingSourceType,
    sourceId: string,
  ): Promise<void>;
}
