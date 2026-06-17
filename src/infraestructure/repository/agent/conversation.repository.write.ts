import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { IConversation } from '../../../domain/agent/entity/interfaces/conversation.interface';
import { IConversationRepositoryWrite } from '../../../domain/agent/repository/conversation.repository.write';
import { ConversationModel } from '../../db/mongo/models/conversation.model';
import { dbToInternal, internalToDb } from './adapters/conversation.adapter';

export class ConversationRepositoryWrite implements IConversationRepositoryWrite {
  async createConversation(conversation: IConversation): Promise<IConversation> {
    try {
      const createdConversation = await ConversationModel.create(
        internalToDb(conversation),
      );
      return dbToInternal(createdConversation);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ConversationRepositoryWrite.createConversation',
        eventData: { conversationId: conversation.id, userId: conversation.userId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async updateConversationById(
    id: string,
    updateData: Partial<Pick<IConversation, 'title' | 'lastMessageAt' | 'updatedAt'>>,
  ): Promise<IConversation | null> {
    try {
      const updatedConversation = await ConversationModel.findOneAndUpdate(
        { id },
        updateData,
        { new: true },
      );
      return updatedConversation ? dbToInternal(updatedConversation) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ConversationRepositoryWrite.updateConversationById',
        eventData: { id, updateData },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async deleteConversationById(id: string): Promise<IConversation | null> {
    try {
      const deletedConversation = await ConversationModel.findOneAndDelete({ id });
      return deletedConversation ? dbToInternal(deletedConversation) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'ConversationRepositoryWrite.deleteConversationById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
