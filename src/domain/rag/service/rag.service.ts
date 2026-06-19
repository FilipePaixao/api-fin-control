import { generateId } from '../../common/utils/generate-id';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { IExpense } from '../../expense/entity/interfaces/expense.interface';
import { IExpenseRepositoryRead } from '../../expense/repository/expense.repository.read';
import { IExpenseIndexFilters } from '../../expense-search/interfaces/expense-index.repository';
import { buildExpenseRagContent } from '../utils/expense-rag-content.utils';
import { EEmbeddingSourceType } from '../entity/enums/EEmbeddingSourceType';
import { IEmbeddingProvider } from '../interfaces/embedding-provider.interface';
import { IRagAnswer, IRagService } from '../interfaces/rag.service.interface';
import { IVectorStoreRepository } from '../repository/vector-store.repository';

interface IParamsRagService {
  expenseRepositoryRead: IExpenseRepositoryRead;
  vectorStoreRepository: IVectorStoreRepository;
  embeddingProvider: IEmbeddingProvider;
}

export class RagService implements IRagService {
  private readonly expenseRepositoryRead: IExpenseRepositoryRead;
  private readonly vectorStoreRepository: IVectorStoreRepository;
  private readonly embeddingProvider: IEmbeddingProvider;

  constructor({
    expenseRepositoryRead,
    vectorStoreRepository,
    embeddingProvider,
  }: IParamsRagService) {
    this.expenseRepositoryRead = expenseRepositoryRead;
    this.vectorStoreRepository = vectorStoreRepository;
    this.embeddingProvider = embeddingProvider;
  }

  async syncUserFinancialContext(userId: string): Promise<void> {
    const expenses = await this.expenseRepositoryRead.listExpenses({ userId });

    for (const expense of expenses) {
      await this.syncExpense(userId, expense);
    }
  }

  async syncExpense(userId: string, expense: IExpense): Promise<void> {
    const content = buildExpenseRagContent(expense);
    const embedding = await this.embeddingProvider.embed(content);

    await this.vectorStoreRepository.upsert(
      {
        id: generateId(),
        userId,
        sourceType: EEmbeddingSourceType.EXPENSE,
        sourceId: expense.id,
        content,
        metadata: {
          amount: expense.amount,
          category: expense.category,
          status: expense.status,
          referenceMonth: expense.referenceMonth,
        },
        referenceMonth: expense.referenceMonth,
        category: expense.category,
        status: expense.status,
        createdAt: new Date(),
      },
      embedding,
    );
  }

  async removeExpense(userId: string, expenseId: string): Promise<void> {
    await this.vectorStoreRepository.deleteBySource(
      userId,
      EEmbeddingSourceType.EXPENSE,
      expenseId,
    );
  }

  async searchExpenses(
    userId: string,
    query: string,
    filters: IExpenseIndexFilters,
    limit: number,
  ): Promise<string[]> {
    const questionEmbedding = await this.embeddingProvider.embed(query);
    const results = await this.vectorStoreRepository.search(
      userId,
      questionEmbedding,
      limit,
      {
        sourceType: EEmbeddingSourceType.EXPENSE,
        referenceMonth: filters.referenceMonth,
        category: filters.category,
        status: filters.status,
      },
    );

    return results.map((result) => result.document.sourceId);
  }

  async askFinancialQuestion(userId: string, question: string): Promise<IRagAnswer> {
    if (!question.trim()) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Question is required',
      } as IThrowedError;
    }

    const questionEmbedding = await this.embeddingProvider.embed(question);
    const results = await this.vectorStoreRepository.search(
      userId,
      questionEmbedding,
      5,
    );

    if (results.length === 0) {
      return {
        answer:
          'I could not find enough financial context for your question yet. Please add expenses or sync your data first.',
        sources: [],
      };
    }

    const context = results
      .map((result) => `- ${result.document.content}`)
      .join('\n');

    return {
      answer: `Based on your financial records, this is the relevant context:\n${context}`,
      sources: results.map((result) => ({
        sourceType: result.document.sourceType,
        sourceId: result.document.sourceId,
        excerpt: result.document.content,
        score: Number(result.score.toFixed(4)),
      })),
    };
  }
}
