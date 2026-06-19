import {
  EMBEDDING_PROVIDER,
  IS_TEST,
} from '../env-constants/env.constants';
import { IEmbeddingProvider } from '../../domain/rag/interfaces/embedding-provider.interface';
import { MockEmbeddingProvider } from '../../infraestructure/rag/mock-embedding.provider';
import { OllamaEmbeddingProvider } from '../../infraestructure/rag/ollama-embedding.provider';

export class EmbeddingProviderFactory {
  static create(): IEmbeddingProvider {
    if (IS_TEST || EMBEDDING_PROVIDER === 'mock') {
      return new MockEmbeddingProvider();
    }

    if (EMBEDDING_PROVIDER === 'ollama') {
      return new OllamaEmbeddingProvider();
    }

    throw new Error(`Unsupported EMBEDDING_PROVIDER: ${EMBEDDING_PROVIDER}`);
  }
}
