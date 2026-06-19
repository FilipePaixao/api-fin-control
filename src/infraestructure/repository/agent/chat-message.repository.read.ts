import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { EChatMessageRole } from '../../../domain/agent/entity/enums/EChatMessageRole';
import { IChatMessage } from '../../../domain/agent/entity/interfaces/chat-message.interface';
import {
  IChatMessageListOptions,
  IChatMessageRepositoryRead,
} from '../../../domain/agent/repository/chat-message.repository.read';
import { ChatMessageModel } from '../../db/mongo/models/chat-message.model';
import { dbToInternal } from './adapters/chat-message.adapter';

export class ChatMessageRepositoryRead implements IChatMessageRepositoryRead {
  async listMessagesByConversationId(
    conversationId: string,
    options?: IChatMessageListOptions,
  ): Promise<IChatMessage[]> {
    try {
      let query = ChatMessageModel.find({ conversationId }).sort({ createdAt: 1 });

      if (options?.skip !== undefined) {
        query = query.skip(options.skip);
      }

      if (options?.limit !== undefined && options.limit > 0) {
        query = query.limit(options.limit);
      }

      const messages = await query;
      return messages.map(dbToInternal);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ChatMessageRepositoryRead.listMessagesByConversationId',
        eventData: { conversationId, options },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async countMessagesByConversationId(conversationId: string): Promise<number> {
    try {
      return ChatMessageModel.countDocuments({ conversationId });
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ChatMessageRepositoryRead.countMessagesByConversationId',
        eventData: { conversationId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async countUserMessagesByConversationId(conversationId: string): Promise<number> {
    try {
      return ChatMessageModel.countDocuments({
        conversationId,
        role: EChatMessageRole.USER,
      });
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ChatMessageRepositoryRead.countUserMessagesByConversationId',
        eventData: { conversationId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async listMessagesIndexedForTraining(limit: number): Promise<IChatMessage[]> {
    try {
      const messages = await ChatMessageModel.find({ indexedForTraining: true })
        .sort({ createdAt: 1 })
        .limit(limit);
      return messages.map(dbToInternal);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ChatMessageRepositoryRead.listMessagesIndexedForTraining',
        eventData: { limit },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async listMessagesPendingTrainingExport(limit: number): Promise<IChatMessage[]> {
    try {
      const messages = await ChatMessageModel.find({
        $or: [{ indexedForTraining: false }, { indexedForTraining: { $exists: false } }],
      })
        .sort({ createdAt: 1 })
        .limit(limit);
      return messages.map(dbToInternal);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ChatMessageRepositoryRead.listMessagesPendingTrainingExport',
        eventData: { limit },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
