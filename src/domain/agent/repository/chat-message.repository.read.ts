import { IChatMessage } from '../entity/interfaces/chat-message.interface';

export interface IChatMessageListOptions {
  skip?: number;
  limit?: number;
}

export interface IChatMessageRepositoryRead {
  listMessagesByConversationId(
    conversationId: string,
    options?: IChatMessageListOptions,
  ): Promise<IChatMessage[]>;
  countMessagesByConversationId(conversationId: string): Promise<number>;
  countUserMessagesByConversationId(conversationId: string): Promise<number>;
  listMessagesIndexedForTraining(limit: number): Promise<IChatMessage[]>;
  listMessagesPendingTrainingExport(limit: number): Promise<IChatMessage[]>;
}
