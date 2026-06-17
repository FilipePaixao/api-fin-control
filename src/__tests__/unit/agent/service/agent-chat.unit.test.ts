import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EAgentActionType } from '../../../../domain/agent/entity/enums/EAgentActionType';
import { AgentService } from '../../../../domain/agent/service/agent.service';
import { ILlmProvider } from '../../../../domain/agent/interfaces/llm-provider.interface';
import { IDashboardService } from '../../../../domain/dashboard/interfaces/dashboard.service.interface';
import { IExpenseService } from '../../../../domain/expense/interfaces/expense.service.interface';

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

describe('When chatting with empty messages in AgentService', () => {
  it('Should reject with FIELD_INVALID', async () => {
    const service = new AgentService({
      llmProvider: createLlmProviderMock(),
      dashboardService: createDashboardServiceMock(),
      expenseService: createExpenseServiceMock(),
    });

    await expect(
      service.chat('user-1', { messages: [{ role: 'user', content: '   ' }] }),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.FIELD_INVALID,
    });
  });
});

describe('When LLM returns a direct reply in AgentService', () => {
  it('Should return assistant message without proposed actions', async () => {
    const llmProvider = createLlmProviderMock({
      chat: jest.fn().mockResolvedValue({
        message: { role: 'assistant', content: 'Olá! Como posso ajudar?' },
        done: true,
      }),
    });

    const service = new AgentService({
      llmProvider,
      dashboardService: createDashboardServiceMock(),
      expenseService: createExpenseServiceMock(),
    });

    const response = await service.chat('user-1', {
      messages: [{ role: 'user', content: 'Oi' }],
    });

    expect(response.message.content).toBe('Olá! Como posso ajudar?');
    expect(response.proposedActions).toBeUndefined();
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

    const service = new AgentService({
      llmProvider,
      dashboardService: createDashboardServiceMock(),
      expenseService,
    });

    const response = await service.chat('user-1', {
      messages: [
        {
          role: 'user',
          content: 'Cadastra despesa de mercado R$ 150 em alimentação',
        },
      ],
    });

    expect(response.proposedActions).toHaveLength(1);
    expect(response.proposedActions?.[0].type).toBe(EAgentActionType.CREATE_EXPENSE);
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
    });

    await expect(
      service.chat('user-1', {
        messages: [{ role: 'user', content: 'Olá' }],
      }),
    ).rejects.toMatchObject({
      status: 503,
      errorCode: EErrorCode.AGENT_LLM_UNAVAILABLE,
    });
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

    const service = new AgentService({
      llmProvider,
      dashboardService,
      expenseService: createExpenseServiceMock(),
    });

    await expect(
      service.chat('user-1', {
        messages: [{ role: 'user', content: 'Qual meu resumo financeiro?' }],
      }),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
    });
  });
});
