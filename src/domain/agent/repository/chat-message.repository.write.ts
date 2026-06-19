import { IChatMessage } from '../entity/interfaces/chat-message.interface';
import { IProposedAction } from '../interfaces/agent.service.interface';

export interface IChatMessageRepositoryWrite {
  createMessage(message: IChatMessage): Promise<IChatMessage>;
  deleteMessagesByConversationId(conversationId: string): Promise<number>;
  markMessagesIndexedForTraining(messageIds: string[]): Promise<number>;
  updateMessageProposedActions(
    messageId: string,
    proposedActions?: IProposedAction[],
  ): Promise<void>;
}
