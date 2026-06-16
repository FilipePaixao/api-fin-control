import { EMBEDDING_VECTOR_SIZE } from '../../configuration/env-constants/env.constants';
import { IEmbeddingProvider } from '../../domain/rag/interfaces/embedding-provider.interface';

export class MockEmbeddingProvider implements IEmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    const vector = new Array<number>(EMBEDDING_VECTOR_SIZE).fill(0);
    for (let index = 0; index < text.length; index += 1) {
      const bucket = index % EMBEDDING_VECTOR_SIZE;
      vector[bucket] += text.charCodeAt(index) / 1000;
    }
    return vector.map((value) => Number(value.toFixed(6)));
  }
}
