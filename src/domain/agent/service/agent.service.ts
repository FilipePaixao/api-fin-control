import { randomUUID } from 'crypto';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { IDashboardService } from '../../dashboard/interfaces/dashboard.service.interface';
import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';
import { ExpenseServiceEntity } from '../../expense/entity/expense.entity';
import { IExpenseService } from '../../expense/interfaces/expense.service.interface';
import { ECurrency } from '../../user/entity/enums/ECurrency';
import { UserServiceEntity } from '../../user/entity/user.entity';
import { EAgentActionType } from '../entity/enums/EAgentActionType';
import {
  IAgentChatRequest,
  IAgentChatResponse,
  IAgentService,
  IProposedAction,
} from '../interfaces/agent.service.interface';
import { ILlmMessage, ILlmProvider } from '../interfaces/llm-provider.interface';
import { AGENT_TOOLS } from '../tools/agent-tools';

const MAX_AGENT_ITERATIONS = 5;
const MAX_HISTORY_MESSAGES = 20;

const SYSTEM_PROMPT = `Você é o assistente do FinControl, um app de controle financeiro pessoal.

Comportamento:
- Responda sempre em português brasileiro, de forma clara e amigável.
- Você pode conversar sobre assuntos gerais quando o usuário quiser (incluindo gatos, hobbies, curiosidades).
- Para dicas de controle financeiro, use as ferramentas de leitura para basear-se nos dados reais do usuário.
- Para cadastrar despesa ou atualizar salário, use SEMPRE as ferramentas propose_create_expense ou propose_update_salary com todos os campos obrigatórios.
- Se faltar informação para cadastrar (nome, valor, categoria, mês etc.), pergunte ao usuário antes de propor a ação.
- Nunca invente dados financeiros — consulte get_financial_summary ou list_expenses quando necessário.
- Categorias de despesa: HOUSING (Moradia), FOOD (Alimentação), TRANSPORT (Transporte), HEALTH (Saúde), EDUCATION (Educação), ENTERTAINMENT (Lazer), SUBSCRIPTIONS (Assinaturas), DEBT (Dívidas), INVESTMENT (Investimentos), OTHER (Outros).
- Mês de referência no formato AAAA-MM. Se o usuário não informar, use o mês atual.
- Ao propor cadastro, informe que o usuário precisará confirmar na interface.`;

interface IParamsAgentService {
  llmProvider: ILlmProvider;
  dashboardService: IDashboardService;
  expenseService: IExpenseService;
}

export class AgentService implements IAgentService {
  private readonly llmProvider: ILlmProvider;
  private readonly dashboardService: IDashboardService;
  private readonly expenseService: IExpenseService;

  constructor({ llmProvider, dashboardService, expenseService }: IParamsAgentService) {
    this.llmProvider = llmProvider;
    this.dashboardService = dashboardService;
    this.expenseService = expenseService;
  }

  async chat(userId: string, request: IAgentChatRequest): Promise<IAgentChatResponse> {
    const userMessages = request.messages.filter((m) => m.content.trim());
    if (userMessages.length === 0) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'At least one message is required',
      } as IThrowedError;
    }

    const trimmedHistory = userMessages.slice(-MAX_HISTORY_MESSAGES);
    const llmMessages: ILlmMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...trimmedHistory.map((message) => ({
        role: message.role as ILlmMessage['role'],
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
          return {
            message: {
              role: 'assistant',
              content: assistantMessage.content.trim() || 'Como posso ajudar?',
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

      return {
        message: {
          role: 'assistant',
          content:
            'Precisei de muitas etapas para processar seu pedido. Pode reformular de forma mais simples?',
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
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  }

  private async toolGetFinancialSummary(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const referenceMonth =
      typeof args.referenceMonth === 'string' ? args.referenceMonth : undefined;
    const summary = await this.dashboardService.getDashboardSummary(
      userId,
      referenceMonth,
    );
    return JSON.stringify(summary);
  }

  private async toolListExpenses(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const expenses = await this.expenseService.listExpenses(userId, {
      referenceMonth:
        typeof args.referenceMonth === 'string' ? args.referenceMonth : undefined,
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
    const referenceMonth = String(args.referenceMonth ?? '').trim();
    const status = this.parseStatus(args.status) ?? EExpenseStatus.PENDING;
    const description =
      typeof args.description === 'string' ? args.description.trim() : undefined;
    const dueDate =
      typeof args.dueDate === 'string' && args.dueDate
        ? new Date(args.dueDate)
        : undefined;

    if (!name || !category || !referenceMonth || !Number.isFinite(amount)) {
      return JSON.stringify({
        error: 'Missing or invalid fields: name, amount, category, referenceMonth are required',
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
