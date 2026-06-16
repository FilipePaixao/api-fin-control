import { Types } from 'mongoose';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { IExpenseRepositoryRead } from '../../expense/repository/expense.repository.read';
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
      const content = [
        `Expense: ${expense.name}`,
        `Amount: ${expense.amount}`,
        `Category: ${expense.category}`,
        `Status: ${expense.status}`,
        `Reference month: ${expense.referenceMonth}`,
      ].join(' | ');

      const embedding = await this.embeddingProvider.embed(content);
      await this.vectorStoreRepository.upsert(
        {
          id: new Types.ObjectId().toHexString(),
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
          createdAt: new Date(),
        },
        embedding,
      );
    }
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
