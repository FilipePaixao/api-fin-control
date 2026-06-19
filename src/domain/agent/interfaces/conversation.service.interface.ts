import { IAppendChatMessageInput, IChatMessage } from '../entity/interfaces/chat-message.interface';
import {
  IConversation,
  ICreateConversationInput,
} from '../entity/interfaces/conversation.interface';

export interface IConversationWithMessages extends IConversation {
  messages: IChatMessage[];
}

export interface IConversationService {
  createConversation(
    userId: string,
    input?: ICreateConversationInput,
  ): Promise<IConversation>;
  listConversations(userId: string): Promise<IConversation[]>;
  getConversationWithMessages(
    userId: string,
    conversationId: string,
  ): Promise<IConversationWithMessages>;
  renameConversation(
    userId: string,
    conversationId: string,
    title: string,
  ): Promise<IConversation>;
  deleteConversation(userId: string, conversationId: string): Promise<void>;
  appendMessage(input: IAppendChatMessageInput): Promise<IChatMessage>;
  getRecentMessages(
    userId: string,
    conversationId: string,
    limit: number,
  ): Promise<IChatMessage[]>;
  assertConversationOwnership(
    userId: string,
    conversationId: string,
  ): Promise<IConversation>;
  updateConversationAfterMessage(
    userId: string,
    conversationId: string,
    userMessageContent: string,
    isFirstUserMessage: boolean,
  ): Promise<void>;
  removeProposedAction(
    userId: string,
    conversationId: string,
    actionId: string,
  ): Promise<void>;
  getOrCreateOnboardingConversation(userId: string): Promise<IConversation>;
}
