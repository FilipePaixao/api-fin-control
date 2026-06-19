import { IConversation } from '../../../../domain/agent/entity/interfaces/conversation.interface';
import { IMConversation } from '../../../db/mongo/interfaces/conversation.interface';

export function dbToInternal(conversation: IMConversation): IConversation {
  return {
    id: conversation.id,
    userId: conversation.userId,
    title: conversation.title,
    type: conversation.type,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    lastMessageAt: conversation.lastMessageAt,
  };
}

export function internalToDb(
  conversation: IConversation,
): Omit<IMConversation, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    id: conversation.id,
    userId: conversation.userId,
    title: conversation.title,
    type: conversation.type,
    lastMessageAt: conversation.lastMessageAt,
  };
}
