import { EEmbeddingSourceType } from '../entity/enums/EEmbeddingSourceType';

export interface IRagSource {
  sourceType: EEmbeddingSourceType;
  sourceId: string;
  excerpt: string;
  score: number;
}

export interface IRagAnswer {
  answer: string;
  sources: IRagSource[];
}

export interface IRagService {
  syncUserFinancialContext(userId: string): Promise<void>;
  askFinancialQuestion(userId: string, question: string): Promise<IRagAnswer>;
}
