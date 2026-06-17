import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { IChatMessage } from '../../../domain/agent/entity/interfaces/chat-message.interface';
import { IChatMessageRepositoryWrite } from '../../../domain/agent/repository/chat-message.repository.write';
import { ChatMessageModel } from '../../db/mongo/models/chat-message.model';
import { dbToInternal, internalToDb } from './adapters/chat-message.adapter';

export class ChatMessageRepositoryWrite implements IChatMessageRepositoryWrite {
  async createMessage(message: IChatMessage): Promise<IChatMessage> {
    try {
      const createdMessage = await ChatMessageModel.create(internalToDb(message));
      return dbToInternal(createdMessage);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ChatMessageRepositoryWrite.createMessage',
        eventData: {
          messageId: message.id,
          conversationId: message.conversationId,
        },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async deleteMessagesByConversationId(conversationId: string): Promise<number> {
    try {
      const result = await ChatMessageModel.deleteMany({ conversationId });
      return result.deletedCount ?? 0;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ChatMessageRepositoryWrite.deleteMessagesByConversationId',
        eventData: { conversationId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async markMessagesIndexedForTraining(messageIds: string[]): Promise<number> {
    try {
      const result = await ChatMessageModel.updateMany(
        { id: { $in: messageIds } },
        { indexedForTraining: true },
      );
      return result.modifiedCount ?? 0;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ChatMessageRepositoryWrite.markMessagesIndexedForTraining',
        eventData: { messageIdsCount: messageIds.length },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
