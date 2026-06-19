import { randomUUID } from 'crypto';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import {
  DEFAULT_REFERENCE_TIMEZONE,
  formatReferenceDateInTimezone,
  getCurrentReferenceMonth,
  resolveReferenceMonth,
} from '../../common/utils/reference-month';
import { IDashboardService } from '../../dashboard/interfaces/dashboard.service.interface';
import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';
import { ExpenseServiceEntity } from '../../expense/entity/expense.entity';
import { IExpenseService } from '../../expense/interfaces/expense.service.interface';
import { ECurrency } from '../../user/entity/enums/ECurrency';
import { UserServiceEntity } from '../../user/entity/user.entity';
import { EAgentActionType } from '../entity/enums/EAgentActionType';
import { EChatMessageRole } from '../entity/enums/EChatMessageRole';
import {
  IAgentChatRequest,
  IAgentChatResponse,
  IAgentService,
  IProposedAction,
} from '../interfaces/agent.service.interface';
import { IConversationService } from '../interfaces/conversation.service.interface';
import { ILlmMessage, ILlmProvider } from '../interfaces/llm-provider.interface';
import { AGENT_TOOLS } from '../tools/agent-tools';
import { IAgentKnowledgeService } from '../interfaces/agent-knowledge.service.interface';
import { IUserRepositoryRead } from '../../user/repository/user.repository.read';
import { isOnboardingComplete } from '../../user/utils/user-profile.utils';
import { buildUserProfileContext } from '../../user/utils/user-profile-context.utils';
import { buildPersonalizationContext } from '../../user/utils/user-personalization-context.utils';
import { buildRegionalContext } from '../../user/utils/regional-context.utils';
import { IRegionalEconomicsService } from '../../regional-economics/interfaces/regional-economics.service.interface';
import { guardAssistantResponse } from '../utils/agent-response-guard';

const MAX_AGENT_ITERATIONS = 5;
const MAX_HISTORY_MESSAGES = 20;

interface IParamsAgentService {
  llmProvider: ILlmProvider;
  dashboardService: IDashboardService;
  expenseService: IExpenseService;
  conversationService: IConversationService;
  userRepositoryRead: IUserRepositoryRead;
  systemPrompt: string;
  agentKnowledgeService?: IAgentKnowledgeService;
  regionalEconomicsService?: IRegionalEconomicsService;
}

export class AgentService implements IAgentService {
  private readonly llmProvider: ILlmProvider;
  private readonly dashboardService: IDashboardService;
  private readonly expenseService: IExpenseService;
  private readonly conversationService: IConversationService;
  private readonly userRepositoryRead: IUserRepositoryRead;
  private readonly systemPrompt: string;
  private readonly agentKnowledgeService?: IAgentKnowledgeService;
  private readonly regionalEconomicsService?: IRegionalEconomicsService;

  constructor({
    llmProvider,
    dashboardService,
    expenseService,
    conversationService,
    userRepositoryRead,
    systemPrompt,
    agentKnowledgeService,
    regionalEconomicsService,
  }: IParamsAgentService) {
    this.llmProvider = llmProvider;
    this.dashboardService = dashboardService;
    this.expenseService = expenseService;
    this.conversationService = conversationService;
    this.userRepositoryRead = userRepositoryRead;
    this.systemPrompt = systemPrompt;
    this.agentKnowledgeService = agentKnowledgeService;
    this.regionalEconomicsService = regionalEconomicsService;
  }

  async chat(userId: string, request: IAgentChatRequest): Promise<IAgentChatResponse> {
    const user = await this.userRepositoryRead.findUserById(userId);
    if (!user || !isOnboardingComplete(user.profile)) {
      throw {
        status: 403,
        errorCode: EErrorCode.ONBOARDING_INCOMPLETE,
        message: 'Complete profile onboarding before using the financial assistant',
      } as IThrowedError;
    }

    const userMessageContent = request.message?.trim();
    if (!userMessageContent) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Message is required',
      } as IThrowedError;
    }

    let conversationId = request.conversationId;
    let isFirstUserMessage = false;

    if (conversationId) {
      await this.conversationService.assertConversationOwnership(userId, conversationId);
      const existingMessages = await this.conversationService.getRecentMessages(
        userId,
        conversationId,
        MAX_HISTORY_MESSAGES,
      );
      isFirstUserMessage = !existingMessages.some(
        (message) => message.role === EChatMessageRole.USER,
      );
    } else {
      const createdConversation = await this.conversationService.createConversation(userId);
      conversationId = createdConversation.id;
      isFirstUserMessage = true;
    }

    await this.conversationService.appendMessage({
      conversationId,
      userId,
      role: EChatMessageRole.USER,
      content: userMessageContent,
    });

    await this.conversationService.updateConversationAfterMessage(
      userId,
      conversationId,
      userMessageContent,
      isFirstUserMessage,
    );

    const storedMessages = await this.conversationService.getRecentMessages(
      userId,
      conversationId,
      MAX_HISTORY_MESSAGES,
    );

    const globalKnowledgeContext = await this.buildGlobalKnowledgeContext(userMessageContent);
    const regionalProfile = this.regionalEconomicsService
      ? await this.regionalEconomicsService.getRegionalCostProfile(user)
      : null;
    const userProfileContext = buildUserProfileContext(user);
    const personalizationContext = buildPersonalizationContext(user, regionalProfile);
    const regionalContext = buildRegionalContext(regionalProfile);

    const llmMessages: ILlmMessage[] = [
      {
        role: 'system',
        content: this.buildSystemPrompt(
          globalKnowledgeContext,
          userProfileContext,
          personalizationContext,
          regionalContext,
        ),
      },
      ...storedMessages.map((message) => ({
        role: (message.role === EChatMessageRole.USER ? 'user' : 'assistant') as ILlmMessage['role'],
        content: message.content,
      })),
    ];

    const proposedActions: IProposedAction[] = [];

    try {
      for (let iteration = 0; iteration < MAX_AGENT_ITERATIONS; iteration += 1) {
        const response = await this.llmProvider.chat({
          messages: llmMessages,
          tools: AGENT_TOOLS,
        });

        const assistantMessage = response.message;
        llmMessages.push(assistantMessage);

        if (!assistantMessage.toolCalls?.length) {
          const assistantContent = guardAssistantResponse(
            assistantMessage.content.trim() || 'Como posso ajudar?',
            proposedActions,
          );

          await this.conversationService.appendMessage({
            conversationId,
            userId,
            role: EChatMessageRole.ASSISTANT,
            content: assistantContent,
            proposedActions: proposedActions.length ? proposedActions : undefined,
          });

          await this.conversationService.updateConversationAfterMessage(
            userId,
            conversationId,
            userMessageContent,
            false,
          );

          this.scheduleGlobalKnowledgeIndexing(userMessageContent, assistantContent);

          return {
            conversationId,
            message: {
              role: 'assistant',
              content: assistantContent,
            },
            proposedActions: proposedActions.length ? proposedActions : undefined,
          };
        }

        for (const toolCall of assistantMessage.toolCalls) {
          const toolResult = await this.executeTool(
            userId,
            toolCall.name,
            toolCall.arguments,
            proposedActions,
          );
          llmMessages.push({
            role: 'tool',
            content: toolResult,
            toolName: toolCall.name,
          });
        }
      }

      const fallbackContent = guardAssistantResponse(
        'Precisei de muitas etapas para processar seu pedido. Pode reformular de forma mais simples?',
        proposedActions,
      );

      await this.conversationService.appendMessage({
        conversationId,
        userId,
        role: EChatMessageRole.ASSISTANT,
        content: fallbackContent,
        proposedActions: proposedActions.length ? proposedActions : undefined,
      });

      return {
        conversationId,
        message: {
          role: 'assistant',
          content: fallbackContent,
        },
        proposedActions: proposedActions.length ? proposedActions : undefined,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'errorCode' in error &&
        'status' in error
      ) {
        throw error;
      }

      throw {
        status: 503,
        errorCode: EErrorCode.AGENT_LLM_UNAVAILABLE,
        message:
          error instanceof Error
            ? error.message
            : 'AI assistant is temporarily unavailable',
      } as IThrowedError;
    }
  }

  private buildSystemPrompt(
    globalKnowledgeContext: string,
    userProfileContext: string,
    personalizationContext: string,
    regionalContext: string,
  ): string {
    const sections = [this.systemPrompt, this.buildTemporalContext()];

    if (userProfileContext) {
      sections.push(`---\n\n${userProfileContext}`);
    }

    if (personalizationContext) {
      sections.push(`---\n\n${personalizationContext}`);
    }

    if (regionalContext) {
      sections.push(`---\n\n${regionalContext}`);
    }

    if (globalKnowledgeContext) {
      sections.push(`---

## Contexto dinâmico — Conhecimento geral da comunidade

> Fonte anonimizada agregada de conversas anteriores. **Não contém dados pessoais de nenhum usuário.**
> Use apenas para enriquecer dicas educativas gerais; **nunca** substitua consulta às ferramentas de leitura para dados deste usuário.

${globalKnowledgeContext}`);
    }

    return sections.join('\n\n');
  }

  private buildTemporalContext(): string {
    const referenceMonth = getCurrentReferenceMonth();
    const today = formatReferenceDateInTimezone();

    return `---

## Contexto temporal (servidor)

- Data de hoje: ${today} (${DEFAULT_REFERENCE_TIMEZONE})
- Mês de referência atual: ${referenceMonth}
- **Padrão obrigatório:** se o usuário falar de gastos/despesas/finanças sem citar mês, use \`referenceMonth=${referenceMonth}\` nas ferramentas de leitura e em \`propose_create_expense\` — **não pergunte qual mês**.
- **Confirmação única:** quando tiver dados suficientes para propor cadastro, chame \`propose_create_expense\` direto — **não** peça confirmação de mês, categoria inferível ou "sim" no chat.
- Use outro mês somente quando o usuário indicar período diferente (ex.: "em maio", "mês passado").`;
  }

  private async buildGlobalKnowledgeContext(userMessage: string): Promise<string> {
    if (!this.agentKnowledgeService) {
      return '';
    }

    try {
      const snippets = await this.agentKnowledgeService.searchGlobalKnowledge(userMessage, 3);
      if (!snippets.length) {
        return '';
      }

      return snippets.map((snippet) => `- ${snippet}`).join('\n');
    } catch {
      return '';
    }
  }

  private scheduleGlobalKnowledgeIndexing(
    userMessage: string,
    assistantMessage: string,
  ): void {
    if (!this.agentKnowledgeService) {
      return;
    }

    setImmediate(() => {
      void this.agentKnowledgeService?.extractAndIndexGlobalInsight(
        userMessage,
        assistantMessage,
      );
    });
  }

  private async executeTool(
    userId: string,
    toolName: string,
    args: Record<string, unknown>,
    proposedActions: IProposedAction[],
  ): Promise<string> {
    switch (toolName) {
      case 'get_financial_summary':
        return this.toolGetFinancialSummary(userId, args);
      case 'list_expenses':
        return this.toolListExpenses(userId, args);
      case 'propose_create_expense':
        return this.toolProposeCreateExpense(userId, args, proposedActions);
      case 'propose_update_salary':
        return this.toolProposeUpdateSalary(args, proposedActions);
      case 'get_regional_cost_profile':
        return this.toolGetRegionalCostProfile(userId);
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  }

  private async toolGetFinancialSummary(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const referenceMonth = resolveReferenceMonth(args.referenceMonth);
    const summary = await this.dashboardService.getDashboardSummary(
      userId,
      referenceMonth,
    );

    if (summary.totalExpenses > 0) {
      return JSON.stringify(summary);
    }

    const allExpenses = await this.expenseService.listExpenses(userId, {});
    const availableReferenceMonths = [
      ...new Set(allExpenses.map((expense) => expense.referenceMonth)),
    ].sort((left, right) => right.localeCompare(left));

    return JSON.stringify({
      ...summary,
      _meta: {
        queriedReferenceMonth: referenceMonth,
        availableReferenceMonths,
      },
    });
  }

  private async toolListExpenses(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const expenses = await this.expenseService.listExpenses(userId, {
      referenceMonth: resolveReferenceMonth(args.referenceMonth),
      category: this.parseCategory(args.category),
      status: this.parseStatus(args.status),
    });
    return JSON.stringify(
      expenses.map((expense) => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        category: expense.category,
        status: expense.status,
        referenceMonth: expense.referenceMonth,
        dueDate: expense.dueDate?.toISOString(),
      })),
    );
  }

  private toolProposeCreateExpense(
    userId: string,
    args: Record<string, unknown>,
    proposedActions: IProposedAction[],
  ): string {
    const name = String(args.name ?? '').trim();
    const amount = Number(args.amount);
    const category = this.parseCategory(args.category);
    const referenceMonth = resolveReferenceMonth(args.referenceMonth);
    const status = this.parseStatus(args.status) ?? EExpenseStatus.PENDING;
    const description =
      typeof args.description === 'string' ? args.description.trim() : undefined;
    const dueDate =
      typeof args.dueDate === 'string' && args.dueDate
        ? new Date(args.dueDate)
        : undefined;

    if (!name || !category || !Number.isFinite(amount)) {
      return JSON.stringify({
        error: 'Missing or invalid fields: name, amount, category are required',
      });
    }

    try {
      ExpenseServiceEntity.validateExpenseInput({
        userId,
        name,
        amount,
        category,
        referenceMonth,
        status,
        description,
        dueDate,
      });
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Invalid expense payload',
      });
    }

    const payload: Record<string, unknown> = {
      name,
      amount,
      category,
      referenceMonth,
      status,
    };
    if (description) payload.description = description;
    if (dueDate && !Number.isNaN(dueDate.getTime())) {
      payload.dueDate = dueDate.toISOString();
    }

    const action: IProposedAction = {
      id: randomUUID(),
      type: EAgentActionType.CREATE_EXPENSE,
      summary: `Cadastrar despesa "${name}" — R$ ${amount.toFixed(2)} (${category})`,
      payload,
    };
    proposedActions.push(action);

    return JSON.stringify({
      status: 'proposed',
      actionId: action.id,
      message: 'Despesa proposta. Aguardando confirmação do usuário na interface.',
    });
  }

  private toolProposeUpdateSalary(
    args: Record<string, unknown>,
    proposedActions: IProposedAction[],
  ): string {
    const amount = Number(args.amount);
    const paymentDay =
      args.paymentDay !== undefined ? Number(args.paymentDay) : undefined;
    const source = typeof args.source === 'string' ? args.source.trim() : undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      return JSON.stringify({ error: 'amount must be a positive number' });
    }

    try {
      UserServiceEntity.validateSalary({
        amount,
        currency: ECurrency.BRL,
        paymentDay,
        source,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Invalid salary payload',
      });
    }

    const payload: Record<string, unknown> = {
      amount,
      currency: ECurrency.BRL,
    };
    if (paymentDay !== undefined) payload.paymentDay = paymentDay;
    if (source) payload.source = source;

    const action: IProposedAction = {
      id: randomUUID(),
      type: EAgentActionType.UPDATE_SALARY,
      summary: `Atualizar renda mensal para R$ ${amount.toFixed(2)}`,
      payload,
    };
    proposedActions.push(action);

    return JSON.stringify({
      status: 'proposed',
      actionId: action.id,
      message: 'Atualização de renda proposta. Aguardando confirmação do usuário.',
    });
  }

  private async toolGetRegionalCostProfile(userId: string): Promise<string> {
    if (!this.regionalEconomicsService) {
      return JSON.stringify({ error: 'Regional economics service unavailable' });
    }

    const user = await this.userRepositoryRead.findUserById(userId);
    if (!user?.profile?.address?.zipCode) {
      return JSON.stringify({
        error: 'User address with zip code is required for regional analysis',
      });
    }

    const regionalProfile =
      await this.regionalEconomicsService.getRegionalCostProfile(user);
    if (!regionalProfile) {
      return JSON.stringify({ error: 'Could not resolve regional cost profile' });
    }

    const referenceMonth = getCurrentReferenceMonth();
    const summary = await this.dashboardService.getDashboardSummary(
      userId,
      referenceMonth,
    );
    const housingCategory = summary.byCategory.find(
      (entry) => entry.category === EExpenseCategory.HOUSING,
    );
    const userHousingExpense = housingCategory?.total ?? 0;
    const benchmarkRent = regionalProfile.adjustedEstimatedRent.oneBedroom;
    const comparison =
      userHousingExpense > 0 && benchmarkRent > 0
        ? {
            userHousingExpense,
            benchmarkOneBedroom: benchmarkRent,
            percentAboveBenchmark:
              Math.round(
                ((userHousingExpense - benchmarkRent) / benchmarkRent) * 10000,
              ) / 100,
          }
        : undefined;

    return JSON.stringify({
      ...regionalProfile,
      comparison,
    });
  }

  private parseCategory(value: unknown): EExpenseCategory | undefined {
    if (typeof value !== 'string') return undefined;
    return Object.values(EExpenseCategory).includes(value as EExpenseCategory)
      ? (value as EExpenseCategory)
      : undefined;
  }

  private parseStatus(value: unknown): EExpenseStatus | undefined {
    if (typeof value !== 'string') return undefined;
    return Object.values(EExpenseStatus).includes(value as EExpenseStatus)
      ? (value as EExpenseStatus)
      : undefined;
  }
}
