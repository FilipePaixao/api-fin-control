import { IConversation } from '../entity/interfaces/conversation.interface';

export interface IConversationRepositoryWrite {
  createConversation(conversation: IConversation): Promise<IConversation>;
  updateConversationById(
    id: string,
    updateData: Partial<Pick<IConversation, 'title' | 'lastMessageAt' | 'updatedAt'>>,
  ): Promise<IConversation | null>;
  deleteConversationById(id: string): Promise<IConversation | null>;
}
