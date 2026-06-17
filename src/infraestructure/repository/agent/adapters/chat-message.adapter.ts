import { IChatMessage } from '../../../../domain/agent/entity/interfaces/chat-message.interface';
import { IMChatMessage } from '../../../db/mongo/interfaces/chat-message.interface';

export function dbToInternal(message: IMChatMessage): IChatMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    userId: message.userId,
    role: message.role,
    content: message.content,
    proposedActions: message.proposedActions,
    indexedForTraining: message.indexedForTraining,
    createdAt: message.createdAt,
  };
}

export function internalToDb(
  message: IChatMessage,
): Omit<IMChatMessage, '_id' | 'createdAt'> {
  return {
    id: message.id,
    conversationId: message.conversationId,
    userId: message.userId,
    role: message.role,
    content: message.content,
    proposedActions: message.proposedActions,
    indexedForTraining: message.indexedForTraining,
  };
}
