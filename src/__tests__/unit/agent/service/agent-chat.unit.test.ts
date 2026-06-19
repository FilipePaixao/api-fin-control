import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { EAgentActionType } from '../../../../domain/agent/entity/enums/EAgentActionType';
import { EChatMessageRole } from '../../../../domain/agent/entity/enums/EChatMessageRole';
import { EConversationType } from '../../../../domain/agent/entity/enums/EConversationType';
import { AgentService } from '../../../../domain/agent/service/agent.service';
import { ILlmProvider } from '../../../../domain/agent/interfaces/llm-provider.interface';
import { IConversationService } from '../../../../domain/agent/interfaces/conversation.service.interface';
import { IAgentKnowledgeService } from '../../../../domain/agent/interfaces/agent-knowledge.service.interface';
import { IDashboardService } from '../../../../domain/dashboard/interfaces/dashboard.service.interface';
import { IExpenseService } from '../../../../domain/expense/interfaces/expense.service.interface';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { EInvestmentProfile } from '../../../../domain/user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../../../domain/user/entity/enums/ELivingSituation';
import { IUserRepositoryRead } from '../../../../domain/user/repository/user.repository.read';
import { getCurrentReferenceMonth } from '../../../../domain/common/utils/reference-month';
import { IRegionalEconomicsService } from '../../../../domain/regional-economics/interfaces/regional-economics.service.interface';
import { ERegionalConfidence } from '../../../../domain/regional-economics/entity/enums/ERegionalConfidence';
import { ERegionalDataSource } from '../../../../domain/regional-economics/entity/enums/ERegionalDataSource';
import { ERegionalFallbackLevel } from '../../../../domain/regional-economics/entity/enums/ERegionalFallbackLevel';

const TEST_SYSTEM_PROMPT = 'Assistente FinControl — prompt de teste unitário.';

const COMPLETE_PROFILE_USER = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@email.com',
  createdAt: new Date(),
  profile: {
    occupationArea: 'Tecnologia',
    investmentProfile: EInvestmentProfile.MODERATE,
    livingSituation: ELivingSituation.ALONE,
    address: {
      zipCode: '01310100',
      street: 'Av Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      number: '100',
    },
    onboardingCompletedAt: new Date(),
  },
};

function createUserRepositoryReadMock(
  override: Partial<IUserRepositoryRead> = {},
): IUserRepositoryRead {
  return {
    findUserById: jest.fn().mockResolvedValue(COMPLETE_PROFILE_USER),
    findUserByEmail: jest.fn(),
    findUserByDocument: jest.fn(),
    findUserByEmailWithPasswordHash: jest.fn(),
    listUsers: jest.fn(),
    ...override,
  };
}

function createEmptyDashboardSummary() {
  return {
    salary: 3500,
    currency: ECurrency.BRL,
    totalExpenses: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    availableBalance: 3500,
    incomeCommitmentPercent: 0,
    byCategory: Object.values(EExpenseCategory).map((category) => ({
      category,
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
    })),
    topExpenses: [],
  };
}

function createLlmProviderMock(
  override: Partial<ILlmProvider> = {},
): ILlmProvider {
  return {
    chat: jest.fn(),
    ...override,
  };
}

function createDashboardServiceMock(
  override: Partial<IDashboardService> = {},
): IDashboardService {
  return {
    getDashboardSummary: jest.fn(),
    ...override,
  };
}

function createExpenseServiceMock(
  override: Partial<IExpenseService> = {},
): IExpenseService {
  return {
    createExpense: jest.fn(),
    listExpenses: jest.fn(),
    getExpenseById: jest.fn(),
    updateExpenseById: jest.fn(),
    deleteExpenseById: jest.fn(),
    payExpenseById: jest.fn(),
    ...override,
  };
}

function createConversationServiceMock(
  override: Partial<IConversationService> = {},
): IConversationService {
  const now = new Date();
  return {
    createConversation: jest.fn().mockResolvedValue({
      id: 'conv-new',
      userId: 'user-1',
      title: 'Nova conversa',
      type: EConversationType.GENERAL,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    }),
    listConversations: jest.fn(),
    getConversationWithMessages: jest.fn(),
    renameConversation: jest.fn(),
    deleteConversation: jest.fn(),
    appendMessage: jest.fn().mockImplementation(async (input) => ({
      id: `msg-${Math.random()}`,
      ...input,
      createdAt: new Date(),
    })),
    getRecentMessages: jest.fn().mockResolvedValue([]),
    assertConversationOwnership: jest.fn().mockResolvedValue({
      id: 'conv-1',
      userId: 'user-1',
      title: 'Nova conversa',
      type: EConversationType.GENERAL,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    }),
    updateConversationAfterMessage: jest.fn(),
    removeProposedAction: jest.fn(),
    getOrCreateOnboardingConversation: jest.fn(),
    ...override,
  };
}

function createAgentKnowledgeServiceMock(
  override: Partial<IAgentKnowledgeService> = {},
): IAgentKnowledgeService {
  return {
    searchGlobalKnowledge: jest.fn().mockResolvedValue([]),
    extractAndIndexGlobalInsight: jest.fn(),
    ...override,
  };
}

describe('When chatting with empty message in AgentService', () => {
  it('Should reject with FIELD_INVALID', async () => {
    const service = new AgentService({
      llmProvider: createLlmProviderMock(),
      dashboardService: createDashboardServiceMock(),
      expenseService: createExpenseServiceMock(),
      conversationService: createConversationServiceMock(),
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
    });

    await expect(
      service.chat('user-1', { message: '   ' }),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.FIELD_INVALID,
    });
  });
});

describe('When LLM returns a direct reply in AgentService', () => {
  it('Should return assistant message with conversationId', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest.fn().mockResolvedValue({
        message: { role: 'assistant', content: 'Olá! Como posso ajudar?' },
        done: true,
      }),
    });

    const conversationService = createConversationServiceMock({
      getRecentMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-new',
          userId: 'user-1',
          role: EChatMessageRole.USER,
          content: 'Oi',
          createdAt: new Date(),
        },
      ]),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService: createDashboardServiceMock(),
      expenseService: createExpenseServiceMock(),
      conversationService,
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
      agentKnowledgeService: createAgentKnowledgeServiceMock(),
    });

    const response = await service.chat('user-1', { message: 'Oi' });

    expect(response.conversationId).toBe('conv-new');
    expect(response.message.content).toBe('Olá! Como posso ajudar?');
    expect(conversationService.appendMessage).toHaveBeenCalled();
  });
});

describe('When LLM proposes create expense via tool in AgentService', () => {
  it('Should return proposed action without persisting', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest
        .fn()
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: '',
            toolCalls: [
              {
                name: 'propose_create_expense',
                arguments: {
                  name: 'Mercado',
                  amount: 150,
                  category: EExpenseCategory.FOOD,
                  referenceMonth: '2026-06',
                },
              },
            ],
          },
          done: false,
        })
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: 'Proposta criada. Confirme na interface.',
          },
          done: true,
        }),
    });

    const expenseService = createExpenseServiceMock();
    const conversationService = createConversationServiceMock({
      getRecentMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          userId: 'user-1',
          role: EChatMessageRole.USER,
          content: 'Cadastra despesa',
          createdAt: new Date(),
        },
      ]),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService: createDashboardServiceMock(),
      expenseService,
      conversationService,
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
    });

    const response = await service.chat('user-1', {
      conversationId: 'conv-1',
      message: 'Cadastra despesa de mercado R$ 150 em alimentação',
    });

    expect(response.proposedActions).toHaveLength(1);
    expect(response.proposedActions?.[0].type).toBe(EAgentActionType.CREATE_EXPENSE);
    expect(expenseService.createExpense).not.toHaveBeenCalled();
  });

  it('Should default referenceMonth to current month when omitted in propose_create_expense', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest
        .fn()
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: '',
            toolCalls: [
              {
                name: 'propose_create_expense',
                arguments: {
                  name: 'Aula de inglês',
                  amount: 900,
                  category: EExpenseCategory.EDUCATION,
                },
              },
            ],
          },
          done: false,
        })
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: 'Proposta criada. Confirme na interface.',
          },
          done: true,
        }),
    });

    const expenseService = createExpenseServiceMock();
    const conversationService = createConversationServiceMock({
      getRecentMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          userId: 'user-1',
          role: EChatMessageRole.USER,
          content: 'Cadastra despesa',
          createdAt: new Date(),
        },
      ]),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService: createDashboardServiceMock(),
      expenseService,
      conversationService,
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
    });

    const response = await service.chat('user-1', {
      conversationId: 'conv-1',
      message: 'Cadastre uma despesa de Aula de ingles no valor de R$900',
    });

    expect(response.proposedActions).toHaveLength(1);
    expect(response.proposedActions?.[0].payload).toMatchObject({
      name: 'Aula de inglês',
      amount: 900,
      category: EExpenseCategory.EDUCATION,
      referenceMonth: getCurrentReferenceMonth(),
    });
    expect(expenseService.createExpense).not.toHaveBeenCalled();
  });
});

describe('When LLM provider fails in AgentService', () => {
  it('Should throw AGENT_LLM_UNAVAILABLE', async () => {
    const service = new AgentService({
      llmProvider: createLlmProviderMock({
        chat: jest.fn().mockRejectedValue(new Error('Connection refused')),
      }),
      dashboardService: createDashboardServiceMock(),
      expenseService: createExpenseServiceMock(),
      conversationService: createConversationServiceMock({
        getRecentMessages: jest.fn().mockResolvedValue([
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            userId: 'user-1',
            role: EChatMessageRole.USER,
            content: 'Olá',
            createdAt: new Date(),
          },
        ]),
      }),
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
    });

    await expect(service.chat('user-1', { message: 'Olá' })).rejects.toMatchObject({
      status: 503,
      errorCode: EErrorCode.AGENT_LLM_UNAVAILABLE,
    });
  });
});

describe('When LLM requests financial summary without referenceMonth in AgentService', () => {
  it('Should default to current reference month on server', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest
        .fn()
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: '',
            toolCalls: [
              {
                name: 'get_financial_summary',
                arguments: {},
              },
            ],
          },
          done: false,
        })
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: 'Seus gastos estão concentrados em alimentação.',
          },
          done: true,
        }),
    });

    const dashboardService = createDashboardServiceMock({
      getDashboardSummary: jest.fn().mockResolvedValue({
        ...createEmptyDashboardSummary(),
        totalExpenses: 500,
      }),
    });

    const conversationService = createConversationServiceMock({
      getRecentMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          userId: 'user-1',
          role: EChatMessageRole.USER,
          content: 'Onde estou gastando mais este mês?',
          createdAt: new Date(),
        },
      ]),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService,
      expenseService: createExpenseServiceMock(),
      conversationService,
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
    });

    await service.chat('user-1', {
      conversationId: 'conv-1',
      message: 'Onde estou gastando mais este mês?',
    });

    const referenceMonthArg = (dashboardService.getDashboardSummary as jest.Mock).mock
      .calls[0][1] as string;

    expect(referenceMonthArg).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });
});

describe('When LLM requests financial summary with padded referenceMonth in AgentService', () => {
  it('Should normalize reference month before querying dashboard', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest
        .fn()
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: '',
            toolCalls: [
              {
                name: 'get_financial_summary',
                arguments: { referenceMonth: ' 2026-05 ' },
              },
            ],
          },
          done: false,
        })
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: 'Em maio seus gastos foram concentrados em moradia.',
          },
          done: true,
        }),
    });

    const dashboardService = createDashboardServiceMock({
      getDashboardSummary: jest.fn().mockResolvedValue(createEmptyDashboardSummary()),
    });

    const conversationService = createConversationServiceMock({
      getRecentMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          userId: 'user-1',
          role: EChatMessageRole.USER,
          content: 'Quanto gastei em maio?',
          createdAt: new Date(),
        },
      ]),
    });

    const expenseService = createExpenseServiceMock({
      listExpenses: jest.fn().mockResolvedValue([]),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService,
      expenseService,
      conversationService,
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
    });

    await service.chat('user-1', {
      conversationId: 'conv-1',
      message: 'Quanto gastei em maio?',
    });

    expect(dashboardService.getDashboardSummary).toHaveBeenCalledWith('user-1', '2026-05');
  });
});

describe('When financial summary is empty but user has expenses in other months in AgentService', () => {
  it('Should include available reference months in tool metadata', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest
        .fn()
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: '',
            toolCalls: [
              {
                name: 'get_financial_summary',
                arguments: { referenceMonth: '2026-06' },
              },
            ],
          },
          done: false,
        })
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: 'Não encontrei despesas em junho, mas há despesas em maio.',
          },
          done: true,
        }),
    });

    const dashboardService = createDashboardServiceMock({
      getDashboardSummary: jest.fn().mockResolvedValue(createEmptyDashboardSummary()),
    });

    const expenseService = createExpenseServiceMock({
      listExpenses: jest.fn().mockResolvedValue([
        {
          id: 'expense-1',
          userId: 'user-1',
          name: 'Rent',
          amount: 1800,
          category: EExpenseCategory.HOUSING,
          status: EExpenseStatus.PENDING,
          referenceMonth: '2026-05',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    });

    const conversationService = createConversationServiceMock({
      getRecentMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          userId: 'user-1',
          role: EChatMessageRole.USER,
          content: 'Onde estou gastando mais este mês?',
          createdAt: new Date(),
        },
      ]),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService,
      expenseService,
      conversationService,
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
    });

    await service.chat('user-1', {
      conversationId: 'conv-1',
      message: 'Onde estou gastando mais este mês?',
    });

    const secondLlmCallMessages = (llmProvider.chat as jest.Mock).mock.calls[1][0].messages;
    const toolMessage = secondLlmCallMessages.find(
      (message: { role: string }) => message.role === 'tool',
    );
    const toolPayload = JSON.parse(toolMessage.content);

    expect(toolPayload._meta).toEqual({
      queriedReferenceMonth: '2026-06',
      availableReferenceMonths: ['2026-05'],
    });
    expect(expenseService.listExpenses).toHaveBeenCalledWith('user-1', {});
  });
});

describe('When user asks about spending without specifying month in AgentService', () => {
  it('Should inject current-month default instructions in system prompt for LLM', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content: 'Com base nos seus dados deste mês, seus maiores gastos são...',
        },
        done: true,
      }),
    });

    const conversationService = createConversationServiceMock({
      getRecentMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          userId: 'user-1',
          role: EChatMessageRole.USER,
          content: 'Quero falar sobre meus gastos',
          createdAt: new Date(),
        },
      ]),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService: createDashboardServiceMock(),
      expenseService: createExpenseServiceMock(),
      conversationService,
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
    });

    await service.chat('user-1', {
      conversationId: 'conv-1',
      message: 'Quero falar sobre meus gastos',
    });

    const systemMessage = (llmProvider.chat as jest.Mock).mock.calls[0][0].messages[0];

    expect(systemMessage.role).toBe('system');
    expect(systemMessage.content).toContain('Padrão obrigatório');
    expect(systemMessage.content).toContain('não pergunte qual mês');
    expect(systemMessage.content).toMatch(/Mês de referência atual: \d{4}-\d{2}/);
  });
});

describe('When a downstream service throws during tool execution in AgentService', () => {
  it('Should propagate the domain error instead of AGENT_LLM_UNAVAILABLE', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content: '',
          toolCalls: [
            {
              name: 'get_financial_summary',
              arguments: {},
            },
          ],
        },
        done: false,
      }),
    });

    const dashboardService = createDashboardServiceMock({
      getDashboardSummary: jest.fn().mockRejectedValue({
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
      }),
    });

    const conversationService = createConversationServiceMock({
      getRecentMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          userId: 'user-1',
          role: EChatMessageRole.USER,
          content: 'Qual meu resumo financeiro?',
          createdAt: new Date(),
        },
      ]),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService,
      expenseService: createExpenseServiceMock(),
      conversationService,
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
    });

    await expect(
      service.chat('user-1', { message: 'Qual meu resumo financeiro?' }),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
    });
  });
});

const REGIONAL_PROFILE_MOCK = {
  zipCode: '01310100',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  dataSource: ERegionalDataSource.FIPE_ZAP,
  referencePeriod: '2026-03',
  rentPerM2: { average: 63.63 },
  estimatedRent: { studio: 2227.05, oneBedroom: 3181.5, twoBedroom: 4454.1 },
  costOfLivingIndex: 142,
  costBreakdown: { housing: 1.42, food: 1.18, transport: 1.25 },
  confidence: ERegionalConfidence.MEDIUM,
  fallbackLevel: ERegionalFallbackLevel.CITY,
  housingSituationFactor: 1,
  adjustedEstimatedRent: { studio: 2227.05, oneBedroom: 3181.5, twoBedroom: 4454.1 },
};

function createRegionalEconomicsServiceMock(
  override: Partial<IRegionalEconomicsService> = {},
): IRegionalEconomicsService {
  return {
    getRegionalCostProfile: jest.fn().mockResolvedValue(REGIONAL_PROFILE_MOCK),
    ...override,
  };
}

describe('When regional economics is enabled in AgentService', () => {
  it('Should inject personalization and regional context in system prompt', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest.fn().mockResolvedValue({
        message: { role: 'assistant', content: 'Com base na sua região...' },
        done: true,
      }),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService: createDashboardServiceMock(),
      expenseService: createExpenseServiceMock(),
      conversationService: createConversationServiceMock(),
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
      regionalEconomicsService: createRegionalEconomicsServiceMock(),
    });

    await service.chat('user-1', { message: 'Quanto custa morar em SP?' });

    const systemContent = (llmProvider.chat as jest.Mock).mock.calls[0][0].messages[0].content;
    expect(systemContent).toContain('Diretrizes de personalização');
    expect(systemContent).toContain('Contexto regional');
    expect(systemContent).toContain('São Paulo');
  });

  it('Should return regional profile with housing comparison via tool', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest
        .fn()
        .mockResolvedValueOnce({
          message: {
            role: 'assistant',
            content: '',
            toolCalls: [{ name: 'get_regional_cost_profile', arguments: {} }],
          },
          done: false,
        })
        .mockResolvedValueOnce({
          message: { role: 'assistant', content: 'Seu aluguel está acima da média.' },
          done: true,
        }),
    });

    const dashboardService = createDashboardServiceMock({
      getDashboardSummary: jest.fn().mockResolvedValue({
        ...createEmptyDashboardSummary(),
        totalExpenses: 3500,
        byCategory: Object.values(EExpenseCategory).map((category) => ({
          category,
          total: category === EExpenseCategory.HOUSING ? 3500 : 0,
          paid: category === EExpenseCategory.HOUSING ? 3500 : 0,
          pending: 0,
          overdue: 0,
        })),
      }),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService,
      expenseService: createExpenseServiceMock(),
      conversationService: createConversationServiceMock(),
      userRepositoryRead: createUserRepositoryReadMock(),
      systemPrompt: TEST_SYSTEM_PROMPT,
      regionalEconomicsService: createRegionalEconomicsServiceMock(),
    });

    await service.chat('user-1', { message: 'Meu aluguel está caro?' });

    const toolMessage = (llmProvider.chat as jest.Mock).mock.calls[1][0].messages.find(
      (message: { role: string }) => message.role === 'tool',
    );
    const toolResult = JSON.parse(toolMessage.content);

    expect(toolResult.city).toBe('São Paulo');
    expect(toolResult.comparison).toMatchObject({
      userHousingExpense: 3500,
      benchmarkOneBedroom: 3181.5,
    });
  });
});
