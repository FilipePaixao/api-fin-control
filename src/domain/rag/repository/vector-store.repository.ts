import { EEmbeddingSourceType } from '../entity/enums/EEmbeddingSourceType';

export interface IVectorSearchFilter {
  sourceType?: EEmbeddingSourceType;
  referenceMonth?: string;
  category?: string;
  status?: string;
}

export interface IVectorDocument {
  id: string;
  userId: string;
  sourceType: EEmbeddingSourceType;
  sourceId: string;
  content: string;
  metadata?: Record<string, unknown>;
  referenceMonth?: string;
  category?: string;
  status?: string;
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
    filter?: IVectorSearchFilter,
  ): Promise<IVectorSearchResult[]>;
  deleteBySource(
    userId: string,
    sourceType: EEmbeddingSourceType,
    sourceId: string,
  ): Promise<void>;
}
