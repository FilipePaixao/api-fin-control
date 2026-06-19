import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EChatMessageRole } from '../../../../domain/agent/entity/enums/EChatMessageRole';
import { ConversationService } from '../../../../domain/agent/service/conversation.service';
import { IChatMessageRepositoryRead } from '../../../../domain/agent/repository/chat-message.repository.read';
import { IChatMessageRepositoryWrite } from '../../../../domain/agent/repository/chat-message.repository.write';
import { IConversationRepositoryRead } from '../../../../domain/agent/repository/conversation.repository.read';
import { IConversationRepositoryWrite } from '../../../../domain/agent/repository/conversation.repository.write';

function createConversationRepositoryReadMock(
  override: Partial<IConversationRepositoryRead> = {},
): IConversationRepositoryRead {
  return {
    findConversationById: jest.fn(),
    listConversationsByUserId: jest.fn(),
    findConversationByUserIdAndType: jest.fn(),
    ...override,
  };
}

function createConversationRepositoryWriteMock(
  override: Partial<IConversationRepositoryWrite> = {},
): IConversationRepositoryWrite {
  return {
    createConversation: jest.fn(),
    updateConversationById: jest.fn(),
    deleteConversationById: jest.fn(),
    ...override,
  };
}

function createChatMessageRepositoryReadMock(
  override: Partial<IChatMessageRepositoryRead> = {},
): IChatMessageRepositoryRead {
  return {
    listMessagesByConversationId: jest.fn(),
    countMessagesByConversationId: jest.fn(),
    countUserMessagesByConversationId: jest.fn(),
    listMessagesIndexedForTraining: jest.fn(),
    listMessagesPendingTrainingExport: jest.fn(),
    ...override,
  };
}

function createChatMessageRepositoryWriteMock(
  override: Partial<IChatMessageRepositoryWrite> = {},
): IChatMessageRepositoryWrite {
  return {
    createMessage: jest.fn(),
    deleteMessagesByConversationId: jest.fn(),
    markMessagesIndexedForTraining: jest.fn(),
    updateMessageProposedActions: jest.fn(),
    ...override,
  };
}

describe('When accessing another user conversation in ConversationService', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const conversationRepositoryRead = createConversationRepositoryReadMock({
      findConversationById: jest.fn().mockResolvedValue({
        id: 'conv-1',
        userId: 'owner-user',
        title: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      }),
    });

    const service = new ConversationService({
      conversationRepositoryRead,
      conversationRepositoryWrite: createConversationRepositoryWriteMock(),
      chatMessageRepositoryRead: createChatMessageRepositoryReadMock(),
      chatMessageRepositoryWrite: createChatMessageRepositoryWriteMock(),
    });

    await expect(
      service.getConversationWithMessages('other-user', 'conv-1'),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
    });
  });
});

describe('When creating a conversation in ConversationService', () => {
  it('Should persist with default title', async () => {
    const createConversation = jest.fn().mockImplementation(async (conversation) => conversation);

    const service = new ConversationService({
      conversationRepositoryRead: createConversationRepositoryReadMock(),
      conversationRepositoryWrite: createConversationRepositoryWriteMock({
        createConversation,
      }),
      chatMessageRepositoryRead: createChatMessageRepositoryReadMock(),
      chatMessageRepositoryWrite: createChatMessageRepositoryWriteMock(),
    });

    const conversation = await service.createConversation('user-1');

    expect(createConversation).toHaveBeenCalled();
    expect(conversation.userId).toBe('user-1');
    expect(conversation.title).toBe('Nova conversa');
  });
});

describe('When updating conversation after first user message in ConversationService', () => {
  it('Should auto-generate title from message content', async () => {
    const updateConversationById = jest.fn().mockResolvedValue(null);

    const conversationRepositoryRead = createConversationRepositoryReadMock({
      findConversationById: jest.fn().mockResolvedValue({
        id: 'conv-1',
        userId: 'user-1',
        title: 'Nova conversa',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      }),
    });

    const service = new ConversationService({
      conversationRepositoryRead,
      conversationRepositoryWrite: createConversationRepositoryWriteMock({
        updateConversationById,
      }),
      chatMessageRepositoryRead: createChatMessageRepositoryReadMock(),
      chatMessageRepositoryWrite: createChatMessageRepositoryWriteMock(),
    });

    await service.updateConversationAfterMessage(
      'user-1',
      'conv-1',
      'Como organizar minhas despesas?',
      true,
    );

    expect(updateConversationById).toHaveBeenCalledWith(
      'conv-1',
      expect.objectContaining({
        title: 'Como organizar minhas despesas?',
      }),
    );
  });
});

describe('When appending a message in ConversationService', () => {
  it('Should create message after ownership validation', async () => {
    const createMessage = jest.fn().mockImplementation(async (message) => message);

    const conversationRepositoryRead = createConversationRepositoryReadMock({
      findConversationById: jest.fn().mockResolvedValue({
        id: 'conv-1',
        userId: 'user-1',
        title: 'Nova conversa',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      }),
    });

    const service = new ConversationService({
      conversationRepositoryRead,
      conversationRepositoryWrite: createConversationRepositoryWriteMock(),
      chatMessageRepositoryRead: createChatMessageRepositoryReadMock(),
      chatMessageRepositoryWrite: createChatMessageRepositoryWriteMock({
        createMessage,
      }),
    });

    const message = await service.appendMessage({
      conversationId: 'conv-1',
      userId: 'user-1',
      role: EChatMessageRole.USER,
      content: 'Olá',
    });

    expect(message.content).toBe('Olá');
    expect(createMessage).toHaveBeenCalled();
  });
});
