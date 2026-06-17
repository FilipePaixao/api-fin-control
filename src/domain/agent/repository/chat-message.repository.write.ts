import { IChatMessage } from '../entity/interfaces/chat-message.interface';

export interface IChatMessageRepositoryWrite {
  createMessage(message: IChatMessage): Promise<IChatMessage>;
  deleteMessagesByConversationId(conversationId: string): Promise<number>;
  markMessagesIndexedForTraining(messageIds: string[]): Promise<number>;
}
