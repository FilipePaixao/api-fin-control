import { AgentTrainingExportService } from '../../../../domain/agent/service/agent-training-export.service';
import { EChatMessageRole } from '../../../../domain/agent/entity/enums/EChatMessageRole';
import { ITrainingDatasetWriter } from '../../../../domain/agent/interfaces/training-dataset-writer.interface';
import { IChatMessageRepositoryRead } from '../../../../domain/agent/repository/chat-message.repository.read';
import { IChatMessageRepositoryWrite } from '../../../../domain/agent/repository/chat-message.repository.write';
import { IAgentModelVersionRepositoryWrite } from '../../../../domain/agent/repository/agent-model-version.repository';

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

describe('When exporting training dataset in AgentTrainingExportService', () => {
  it('Should reject pairs containing monetary PII', () => {
    const service = new AgentTrainingExportService({
      chatMessageRepositoryRead: createChatMessageRepositoryReadMock(),
      chatMessageRepositoryWrite: createChatMessageRepositoryWriteMock(),
      agentModelVersionRepositoryWrite: {
        createModelVersion: jest.fn(),
      } as IAgentModelVersionRepositoryWrite,
      trainingDatasetWriter: {
        writeJsonLines: jest.fn(),
      } as ITrainingDatasetWriter,
      minSamples: 1,
      modelTag: 'fincontrol-agent',
    });

    expect(
      service.isAnonymizedPairSafe({
        instruction: 'Como economizar?',
        response: 'Evite gastar R$ 500 em lazer.',
        messageIds: ['a', 'b'],
      }),
    ).toBe(false);
  });

  it('Should accept general financial advice pairs', () => {
    const service = new AgentTrainingExportService({
      chatMessageRepositoryRead: createChatMessageRepositoryReadMock(),
      chatMessageRepositoryWrite: createChatMessageRepositoryWriteMock(),
      agentModelVersionRepositoryWrite: {
        createModelVersion: jest.fn(),
      } as IAgentModelVersionRepositoryWrite,
      trainingDatasetWriter: {
        writeJsonLines: jest.fn(),
      } as ITrainingDatasetWriter,
      minSamples: 1,
      modelTag: 'fincontrol-agent',
    });

    expect(
      service.isAnonymizedPairSafe({
        instruction: 'Como organizar despesas?',
        response: 'Separe gastos fixos e variáveis por categoria.',
        messageIds: ['a', 'b'],
      }),
    ).toBe(true);
  });
});

describe('When not enough samples for export in AgentTrainingExportService', () => {
  it('Should throw FIELD_INVALID', async () => {
    const service = new AgentTrainingExportService({
      chatMessageRepositoryRead: createChatMessageRepositoryReadMock({
        listMessagesPendingTrainingExport: jest.fn().mockResolvedValue([
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            userId: 'user-1',
            role: EChatMessageRole.USER,
            content: 'Dica?',
            createdAt: new Date(),
          },
          {
            id: 'msg-2',
            conversationId: 'conv-1',
            userId: 'user-1',
            role: EChatMessageRole.ASSISTANT,
            content: 'Organize por categorias.',
            createdAt: new Date(),
          },
        ]),
      }),
      chatMessageRepositoryWrite: createChatMessageRepositoryWriteMock(),
      agentModelVersionRepositoryWrite: {
        createModelVersion: jest.fn(),
      } as IAgentModelVersionRepositoryWrite,
      trainingDatasetWriter: {
        writeJsonLines: jest.fn(),
      } as ITrainingDatasetWriter,
      minSamples: 500,
      modelTag: 'fincontrol-agent',
    });

    await expect(
      service.exportAnonymizedDataset('/tmp/test-dataset.jsonl'),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: 'FIELD_INVALID',
    });
  });
});
