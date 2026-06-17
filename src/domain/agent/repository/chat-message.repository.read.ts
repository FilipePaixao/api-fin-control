import { IChatMessage } from '../entity/interfaces/chat-message.interface';

export interface IChatMessageRepositoryRead {
  listMessagesByConversationId(
    conversationId: string,
    limit?: number,
  ): Promise<IChatMessage[]>;
  countUserMessagesByConversationId(conversationId: string): Promise<number>;
  listMessagesIndexedForTraining(limit: number): Promise<IChatMessage[]>;
  listMessagesPendingTrainingExport(limit: number): Promise<IChatMessage[]>;
}
