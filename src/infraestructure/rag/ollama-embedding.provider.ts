import {
  EMBEDDING_VECTOR_SIZE,
  OLLAMA_BASE_URL,
  OLLAMA_EMBEDDING_MODEL,
  OLLAMA_TIMEOUT_MS,
} from '../../configuration/env-constants/env.constants';
import { IEmbeddingProvider } from '../../domain/rag/interfaces/embedding-provider.interface';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly expectedVectorSize: number;

  constructor(
    baseUrl = OLLAMA_BASE_URL,
    model = OLLAMA_EMBEDDING_MODEL,
    timeoutMs = OLLAMA_TIMEOUT_MS,
    expectedVectorSize = EMBEDDING_VECTOR_SIZE,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.expectedVectorSize = expectedVectorSize;
  }

  async embed(text: string): Promise<number[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Ollama embedding request failed (${response.status}): ${body || response.statusText}`,
        );
      }

      const data = (await response.json()) as OllamaEmbeddingResponse;
      if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
        throw new Error('Ollama embedding response is empty');
      }

      if (data.embedding.length !== this.expectedVectorSize) {
        throw new Error(
          `Embedding dimension mismatch: expected ${this.expectedVectorSize}, got ${data.embedding.length}. Adjust EMBEDDING_VECTOR_SIZE or OLLAMA_EMBEDDING_MODEL.`,
        );
      }

      return data.embedding;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Ollama embedding request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
