import { randomUUID } from 'crypto';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { EConversationType } from '../entity/enums/EConversationType';
import { EChatMessageRole } from '../entity/enums/EChatMessageRole';
import {
  IAppendChatMessageInput,
  IChatMessage,
} from '../entity/interfaces/chat-message.interface';
import {
  IConversation,
  ICreateConversationInput,
} from '../entity/interfaces/conversation.interface';
import {
  IConversationService,
  IConversationWithMessages,
} from '../interfaces/conversation.service.interface';
import { IChatMessageRepositoryRead } from '../repository/chat-message.repository.read';
import { IChatMessageRepositoryWrite } from '../repository/chat-message.repository.write';
import { IConversationRepositoryRead } from '../repository/conversation.repository.read';
import { IConversationRepositoryWrite } from '../repository/conversation.repository.write';

const DEFAULT_CONVERSATION_TITLE = 'Nova conversa';
const AUTO_TITLE_MAX_LENGTH = 60;

interface IParamsConversationService {
  conversationRepositoryRead: IConversationRepositoryRead;
  conversationRepositoryWrite: IConversationRepositoryWrite;
  chatMessageRepositoryRead: IChatMessageRepositoryRead;
  chatMessageRepositoryWrite: IChatMessageRepositoryWrite;
}

export class ConversationService implements IConversationService {
  private readonly conversationRepositoryRead: IConversationRepositoryRead;
  private readonly conversationRepositoryWrite: IConversationRepositoryWrite;
  private readonly chatMessageRepositoryRead: IChatMessageRepositoryRead;
  private readonly chatMessageRepositoryWrite: IChatMessageRepositoryWrite;

  constructor({
    conversationRepositoryRead,
    conversationRepositoryWrite,
    chatMessageRepositoryRead,
    chatMessageRepositoryWrite,
  }: IParamsConversationService) {
    this.conversationRepositoryRead = conversationRepositoryRead;
    this.conversationRepositoryWrite = conversationRepositoryWrite;
    this.chatMessageRepositoryRead = chatMessageRepositoryRead;
    this.chatMessageRepositoryWrite = chatMessageRepositoryWrite;
  }

  async createConversation(
    userId: string,
    input: ICreateConversationInput = {},
  ): Promise<IConversation> {
    const now = new Date();
    const conversation: IConversation = {
      id: randomUUID(),
      userId,
      title: input.title?.trim() || DEFAULT_CONVERSATION_TITLE,
      type: input.type ?? EConversationType.GENERAL,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    };

    return this.conversationRepositoryWrite.createConversation(conversation);
  }

  async listConversations(userId: string): Promise<IConversation[]> {
    const conversations = await this.conversationRepositoryRead.listConversationsByUserId(
      userId,
      EConversationType.GENERAL,
    );
    return conversations;
  }

  async getConversationWithMessages(
    userId: string,
    conversationId: string,
  ): Promise<IConversationWithMessages> {
    const conversation = await this.assertConversationOwnership(userId, conversationId);
    const messages = await this.chatMessageRepositoryRead.listMessagesByConversationId(
      conversationId,
    );

    return { ...conversation, messages };
  }

  async renameConversation(
    userId: string,
    conversationId: string,
    title: string,
  ): Promise<IConversation> {
    await this.assertConversationOwnership(userId, conversationId);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Conversation title is required',
      } as IThrowedError;
    }

    const updatedConversation = await this.conversationRepositoryWrite.updateConversationById(
      conversationId,
      { title: trimmedTitle, updatedAt: new Date() },
    );

    if (!updatedConversation) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'Conversation not found',
      } as IThrowedError;
    }

    return updatedConversation;
  }

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    await this.assertConversationOwnership(userId, conversationId);
    await this.chatMessageRepositoryWrite.deleteMessagesByConversationId(conversationId);
    await this.conversationRepositoryWrite.deleteConversationById(conversationId);
  }

  async appendMessage(input: IAppendChatMessageInput): Promise<IChatMessage> {
    await this.assertConversationOwnership(input.userId, input.conversationId);

    const message: IChatMessage = {
      id: randomUUID(),
      conversationId: input.conversationId,
      userId: input.userId,
      role: input.role,
      content: input.content,
      proposedActions: input.proposedActions,
      indexedForTraining: input.indexedForTraining ?? false,
      createdAt: new Date(),
    };

    return this.chatMessageRepositoryWrite.createMessage(message);
  }

  async getRecentMessages(
    userId: string,
    conversationId: string,
    limit: number,
  ): Promise<IChatMessage[]> {
    await this.assertConversationOwnership(userId, conversationId);
    const totalCount =
      await this.chatMessageRepositoryRead.countMessagesByConversationId(conversationId);
    const skipCount = Math.max(0, totalCount - limit);

    return this.chatMessageRepositoryRead.listMessagesByConversationId(conversationId, {
      skip: skipCount,
      limit,
    });
  }

  async assertConversationOwnership(
    userId: string,
    conversationId: string,
  ): Promise<IConversation> {
    const conversation = await this.conversationRepositoryRead.findConversationById(
      conversationId,
    );

    if (!conversation || conversation.userId !== userId) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'Conversation not found',
      } as IThrowedError;
    }

    return conversation;
  }

  async updateConversationAfterMessage(
    userId: string,
    conversationId: string,
    userMessageContent: string,
    isFirstUserMessage: boolean,
  ): Promise<void> {
    await this.assertConversationOwnership(userId, conversationId);

    const updateData: Partial<Pick<IConversation, 'title' | 'lastMessageAt' | 'updatedAt'>> = {
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    };

    if (isFirstUserMessage) {
      updateData.title = this.buildAutoTitle(userMessageContent);
    }

    await this.conversationRepositoryWrite.updateConversationById(conversationId, updateData);
  }

  async removeProposedAction(
    userId: string,
    conversationId: string,
    actionId: string,
  ): Promise<void> {
    await this.assertConversationOwnership(userId, conversationId);

    const messages = await this.chatMessageRepositoryRead.listMessagesByConversationId(
      conversationId,
    );
    const lastAssistant = [...messages]
      .reverse()
      .find((message) => message.role === EChatMessageRole.ASSISTANT);

    if (!lastAssistant?.proposedActions?.length) {
      return;
    }

    const remainingActions = lastAssistant.proposedActions.filter(
      (action) => action.id !== actionId,
    );

    if (remainingActions.length === lastAssistant.proposedActions.length) {
      return;
    }

    const proposedActionsToPersist =
      remainingActions.length > 0 ? remainingActions : undefined;

    await this.chatMessageRepositoryWrite.updateMessageProposedActions(
      lastAssistant.id,
      proposedActionsToPersist,
    );
  }

  private buildAutoTitle(content: string): string {
    const normalizedContent = content.trim().replace(/\s+/g, ' ');
    if (!normalizedContent) {
      return DEFAULT_CONVERSATION_TITLE;
    }

    if (normalizedContent.length <= AUTO_TITLE_MAX_LENGTH) {
      return normalizedContent;
    }

    return `${normalizedContent.slice(0, AUTO_TITLE_MAX_LENGTH - 3)}...`;
  }

  async getOrCreateOnboardingConversation(userId: string): Promise<IConversation> {
    const existingConversation =
      await this.conversationRepositoryRead.findConversationByUserIdAndType(
        userId,
        EConversationType.ONBOARDING,
      );

    if (existingConversation) {
      return existingConversation;
    }

    return this.createConversation(userId, {
      title: 'Conhecendo você',
      type: EConversationType.ONBOARDING,
    });
  }
}