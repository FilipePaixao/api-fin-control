import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { EConversationType } from '../../../domain/agent/entity/enums/EConversationType';
import { IConversation } from '../../../domain/agent/entity/interfaces/conversation.interface';
import { IConversationRepositoryRead } from '../../../domain/agent/repository/conversation.repository.read';
import { ConversationModel } from '../../db/mongo/models/conversation.model';
import { dbToInternal } from './adapters/conversation.adapter';

export class ConversationRepositoryRead implements IConversationRepositoryRead {
  async findConversationById(id: string): Promise<IConversation | null> {
    try {
      const conversation = await ConversationModel.findOne({ id });
      return conversation ? dbToInternal(conversation) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ConversationRepositoryRead.findConversationById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async listConversationsByUserId(
    userId: string,
    type?: EConversationType,
  ): Promise<IConversation[]> {
    try {
      const filter: Record<string, unknown> = { userId };
      if (type) {
        filter.type = type;
      }
      const conversations = await ConversationModel.find(filter).sort({
        lastMessageAt: -1,
      });
      return conversations.map(dbToInternal);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ConversationRepositoryRead.listConversationsByUserId',
        eventData: { userId, type },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async findConversationByUserIdAndType(
    userId: string,
    type: EConversationType,
  ): Promise<IConversation | null> {
    try {
      const conversation = await ConversationModel.findOne({ userId, type });
      return conversation ? dbToInternal(conversation) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ConversationRepositoryRead.findConversationByUserIdAndType',
        eventData: { userId, type },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
