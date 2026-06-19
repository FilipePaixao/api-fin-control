import { EConversationType } from '../entity/enums/EConversationType';
import { IConversation } from '../entity/interfaces/conversation.interface';

export interface IConversationRepositoryRead {
  findConversationById(id: string): Promise<IConversation | null>;
  listConversationsByUserId(
    userId: string,
    type?: EConversationType,
  ): Promise<IConversation[]>;
  findConversationByUserIdAndType(
    userId: string,
    type: EConversationType,
  ): Promise<IConversation | null>;
}
