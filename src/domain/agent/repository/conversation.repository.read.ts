import { IConversation } from '../entity/interfaces/conversation.interface';

export interface IConversationRepositoryRead {
  findConversationById(id: string): Promise<IConversation | null>;
  listConversationsByUserId(userId: string): Promise<IConversation[]>;
}
