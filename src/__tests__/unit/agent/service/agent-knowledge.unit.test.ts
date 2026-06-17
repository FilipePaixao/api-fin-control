import { AgentKnowledgeService } from '../../../../domain/agent/service/agent-knowledge.service';
import { ILlmProvider } from '../../../../domain/agent/interfaces/llm-provider.interface';
import { IEmbeddingProvider } from '../../../../domain/rag/interfaces/embedding-provider.interface';
import { IGlobalKnowledgeRepository } from '../../../../domain/agent/repository/global-knowledge.repository';

function createLlmProviderMock(override: Partial<ILlmProvider> = {}): ILlmProvider {
  return {
    chat: jest.fn(),
    ...override,
  };
}

function createEmbeddingProviderMock(
  override: Partial<IEmbeddingProvider> = {},
): IEmbeddingProvider {
  return {
    embed: jest.fn().mockResolvedValue([0.1, 0.2]),
    ...override,
  };
}

function createGlobalKnowledgeRepositoryMock(
  override: Partial<IGlobalKnowledgeRepository> = {},
): IGlobalKnowledgeRepository {
  return {
    upsert: jest.fn(),
    search: jest.fn().mockResolvedValue([]),
    ...override,
  };
}

describe('When content contains PII in AgentKnowledgeService', () => {
  it('Should reject indexing via isSafeForGlobalIndex', () => {
    const service = new AgentKnowledgeService({
      llmProvider: createLlmProviderMock(),
      embeddingProvider: createEmbeddingProviderMock(),
      globalKnowledgeRepository: createGlobalKnowledgeRepositoryMock(),
    });

    expect(service.isSafeForGlobalIndex('Envie para joao@email.com')).toBe(false);
    expect(service.isSafeForGlobalIndex('Pague R$ 1500 no mercado')).toBe(false);
    expect(
      service.isSafeForGlobalIndex('Organize despesas por categoria mensalmente'),
    ).toBe(true);
  });
});

describe('When LLM returns NONE in AgentKnowledgeService', () => {
  it('Should not upsert global knowledge', async () => {
    const globalKnowledgeRepository = createGlobalKnowledgeRepositoryMock();
    const service = new AgentKnowledgeService({
      llmProvider: createLlmProviderMock({
        chat: jest.fn().mockResolvedValue({
          message: { role: 'assistant', content: 'NONE' },
          done: true,
        }),
      }),
      embeddingProvider: createEmbeddingProviderMock(),
      globalKnowledgeRepository,
    });

    await service.extractAndIndexGlobalInsight('Quanto gastei?', 'Seu total foi R$ 500');

    expect(globalKnowledgeRepository.upsert).not.toHaveBeenCalled();
  });
});

describe('When LLM returns general insight in AgentKnowledgeService', () => {
  it('Should embed and upsert without userId in document', async () => {
    const globalKnowledgeRepository = createGlobalKnowledgeRepositoryMock();
    const service = new AgentKnowledgeService({
      llmProvider: createLlmProviderMock({
        chat: jest.fn().mockResolvedValue({
          message: {
            role: 'assistant',
            content: 'Separar gastos fixos e variáveis facilita o controle mensal.',
          },
          done: true,
        }),
      }),
      embeddingProvider: createEmbeddingProviderMock(),
      globalKnowledgeRepository,
    });

    await service.extractAndIndexGlobalInsight(
      'Como melhorar meu controle?',
      'Tente categorizar suas despesas.',
    );

    expect(globalKnowledgeRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Separar gastos fixos e variáveis facilita o controle mensal.',
      }),
      expect.any(Array),
    );

    const upsertCall = (globalKnowledgeRepository.upsert as jest.Mock).mock.calls[0][0];
    expect(upsertCall).not.toHaveProperty('userId');
  });
});
