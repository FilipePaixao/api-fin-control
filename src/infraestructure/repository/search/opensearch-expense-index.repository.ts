import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { OPENSEARCH_INDEX, OPENSEARCH_REFRESH_ON_WRITE } from '../../../configuration/env-constants/env.constants';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import {
  IExpenseIndexDocument,
  IExpenseIndexFilters,
  IExpenseIndexRepository,
} from '../../../domain/expense-search/interfaces/expense-index.repository';
import { getOpenSearchClient } from '../../clients/opensearch.client';

const INDEX_BODY = {
  settings: {
    analysis: {
      filter: {
        pt_stop: {
          type: 'stop',
          stopwords: '_brazilian_',
        },
        pt_stemmer: {
          type: 'stemmer',
          language: 'brazilian',
        },
        pt_synonyms: {
          type: 'synonym',
          synonyms: [
            'assinatura, assinaturas, subscription, subscriptions',
            'moradia, aluguel, housing',
            'alimentacao, alimentação, food, comida',
            'transporte, transport',
          ],
        },
      },
      analyzer: {
        pt_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding', 'pt_stop', 'pt_stemmer', 'pt_synonyms'],
        },
      },
    },
  },
  mappings: {
    properties: {
      userId: { type: 'keyword' },
      expenseId: { type: 'keyword' },
      name: { type: 'text', analyzer: 'pt_analyzer' },
      description: { type: 'text', analyzer: 'pt_analyzer' },
      category: { type: 'keyword' },
      categoryLabel: { type: 'text', analyzer: 'pt_analyzer' },
      status: { type: 'keyword' },
      referenceMonth: { type: 'keyword' },
    },
  },
};

export class OpenSearchExpenseIndexRepository implements IExpenseIndexRepository {
  private indexReady = false;

  async recreateIndex(): Promise<void> {
    try {
      const client = getOpenSearchClient();
      const exists = await client.indices.exists({ index: OPENSEARCH_INDEX });

      if (exists.body) {
        await client.indices.delete({ index: OPENSEARCH_INDEX });
      }

      await client.indices.create({
        index: OPENSEARCH_INDEX,
        body: INDEX_BODY as Record<string, unknown>,
      });

      this.indexReady = true;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'OpenSearchExpenseIndexRepository.recreateIndex',
        eventData: { index: OPENSEARCH_INDEX },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async ensureIndex(): Promise<void> {
    if (this.indexReady) {
      return;
    }

    try {
      const client = getOpenSearchClient();
      const exists = await client.indices.exists({ index: OPENSEARCH_INDEX });

      if (!exists.body) {
        await client.indices.create({
          index: OPENSEARCH_INDEX,
          body: INDEX_BODY as Record<string, unknown>,
        });
      }

      this.indexReady = true;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'OpenSearchExpenseIndexRepository.ensureIndex',
        eventData: { index: OPENSEARCH_INDEX },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async upsert(document: IExpenseIndexDocument): Promise<void> {
    try {
      await this.ensureIndex();
      const client = getOpenSearchClient();

      await client.index({
        index: OPENSEARCH_INDEX,
        id: `${document.userId}:${document.expenseId}`,
        body: document,
        refresh: OPENSEARCH_REFRESH_ON_WRITE,
      });
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'OpenSearchExpenseIndexRepository.upsert',
        eventData: {
          userId: document.userId,
          expenseId: document.expenseId,
        },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async delete(userId: string, expenseId: string): Promise<void> {
    try {
      await this.ensureIndex();
      const client = getOpenSearchClient();

      await client.delete({
        index: OPENSEARCH_INDEX,
        id: `${userId}:${expenseId}`,
        refresh: OPENSEARCH_REFRESH_ON_WRITE,
      });
    } catch (error: any) {
      if (error?.meta?.statusCode === 404) {
        return;
      }

      serviceLogErrorHandler(error, {
        eventName: 'OpenSearchExpenseIndexRepository.delete',
        eventData: { userId, expenseId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async search(
    userId: string,
    query: string,
    filters: IExpenseIndexFilters,
    limit: number,
  ): Promise<string[]> {
    try {
      await this.ensureIndex();
      const client = getOpenSearchClient();

      const filterClauses: Record<string, unknown>[] = [{ term: { userId } }];
      if (filters.referenceMonth) {
        filterClauses.push({ term: { referenceMonth: filters.referenceMonth } });
      }
      if (filters.category) {
        filterClauses.push({ term: { category: filters.category } });
      }
      if (filters.status) {
        filterClauses.push({ term: { status: filters.status } });
      }

      const response = await client.search({
        index: OPENSEARCH_INDEX,
        body: {
          size: limit,
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query,
                    fields: ['name^3', 'categoryLabel^2', 'description'],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                  },
                },
              ],
              filter: filterClauses,
            },
          },
          _source: ['expenseId'],
        },
      });

      const hits = response.body.hits?.hits || [];
      return hits
        .map((hit: { _source?: { expenseId?: string } }) => hit._source?.expenseId)
        .filter((expenseId: string | undefined): expenseId is string => Boolean(expenseId));
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'OpenSearchExpenseIndexRepository.search',
        eventData: { userId, query, filters, limit },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
