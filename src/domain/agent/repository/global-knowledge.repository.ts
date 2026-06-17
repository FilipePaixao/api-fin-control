import { EEmbeddingSourceType } from '../../rag/entity/enums/EEmbeddingSourceType';

export interface IGlobalKnowledgeDocument {
  id: string;
  sourceType: EEmbeddingSourceType;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IGlobalKnowledgeSearchResult {
  document: IGlobalKnowledgeDocument;
  score: number;
}

export interface IGlobalKnowledgeRepository {
  upsert(document: IGlobalKnowledgeDocument, embedding: number[]): Promise<void>;
  search(embedding: number[], limit: number): Promise<IGlobalKnowledgeSearchResult[]>;
}
