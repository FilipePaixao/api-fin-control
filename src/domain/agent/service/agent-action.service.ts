import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../expense/entity/enums/EExpenseStatus';
import { ExpenseServiceEntity } from '../../expense/entity/expense.entity';
import { IExpenseService } from '../../expense/interfaces/expense.service.interface';
import { EIncomeCategory } from '../../income/entity/enums/EIncomeCategory';
import { IncomeServiceEntity } from '../../income/entity/income.entity';
import { IIncomeService } from '../../income/interfaces/income.service.interface';
import { IRagService } from '../../rag/interfaces/rag.service.interface';
import { ECurrency } from '../../user/entity/enums/ECurrency';
import { UserServiceEntity } from '../../user/entity/user.entity';
import { IUserService } from '../../user/interfaces/user.service.interface';
import { IConversationService } from '../interfaces/conversation.service.interface';
import { EAgentActionType } from '../entity/enums/EAgentActionType';
import {
  IAgentActionService,
  IExecuteAgentActionResult,
} from '../interfaces/agent.service.interface';

interface IParamsAgentActionService {
  expenseService: IExpenseService;
  incomeService: IIncomeService;
  userService: IUserService;
  ragService: IRagService;
  conversationService: IConversationService;
}

export class AgentActionService implements IAgentActionService {
  private readonly expenseService: IExpenseService;
  private readonly incomeService: IIncomeService;
  private readonly userService: IUserService;
  private readonly ragService: IRagService;
  private readonly conversationService: IConversationService;

  constructor({
    expenseService,
    incomeService,
    userService,
    ragService,
    conversationService,
  }: IParamsAgentActionService) {
    this.expenseService = expenseService;
    this.incomeService = incomeService;
    this.userService = userService;
    this.ragService = ragService;
    this.conversationService = conversationService;
  }

  async executeAction(
    userId: string,
    input: { type?: unknown; payload?: unknown; conversationId?: unknown; actionId?: unknown },
  ): Promise<IExecuteAgentActionResult> {
    const payload = (input.payload ?? {}) as Record<string, unknown>;
    const conversationId =
      typeof input.conversationId === 'string' ? input.conversationId.trim() : undefined;
    const actionId = typeof input.actionId === 'string' ? input.actionId.trim() : undefined;

    let result: IExecuteAgentActionResult;

    switch (input.type) {
      case EAgentActionType.CREATE_EXPENSE:
        result = await this.executeCreateExpense(userId, payload);
        break;
      case EAgentActionType.CREATE_INCOME:
        result = await this.executeCreateIncome(userId, payload);
        break;
      case EAgentActionType.UPDATE_SALARY:
        result = await this.executeUpdateSalary(userId, payload);
        break;
      default:
        throw {
          status: 400,
          errorCode: EErrorCode.FIELD_INVALID,
          message: 'Invalid action type',
        } as IThrowedError;
    }

    if (result.success && conversationId && actionId) {
      await this.removeProposedActionSafely(userId, conversationId, actionId);
    }

    return result;
  }

  private async executeCreateExpense(
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<IExecuteAgentActionResult> {
    const name = String(payload.name ?? '').trim();
    const amount = Number(payload.amount);
    const category = payload.category as EExpenseCategory;
    const referenceMonth = String(payload.referenceMonth ?? '').trim();
    const status = (payload.status as EExpenseStatus) ?? EExpenseStatus.PENDING;
    const description =
      typeof payload.description === 'string' ? payload.description.trim() : undefined;
    const dueDate =
      typeof payload.dueDate === 'string' && payload.dueDate
        ? new Date(payload.dueDate)
        : undefined;
    const totalInstallments = Number(payload.totalInstallments);
    const totalAmount = Number(payload.totalAmount ?? payload.amount);

    if (totalInstallments >= 2) {
      const expenses = await this.expenseService.createInstallmentExpenses(userId, {
        userId,
        name,
        totalAmount,
        totalInstallments,
        category,
        referenceMonth,
        description,
        dueDate,
      });

      await this.syncRagSafely(userId);

      return {
        success: true,
        message: `${expenses.length} parcelas de "${name}" cadastradas com sucesso.`,
        data: {
          installmentGroupId: expenses[0]?.installmentGroupId,
          totalInstallments: expenses.length,
          totalAmount,
        },
      };
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
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid expense payload',
      } as IThrowedError;
    }

    const expense = await this.expenseService.createExpense(userId, {
      userId,
      name,
      amount,
      category,
      referenceMonth,
      status,
      description,
      dueDate,
    });

    await this.syncRagSafely(userId);

    return {
      success: true,
      message: `Despesa "${expense.name}" cadastrada com sucesso.`,
      data: {
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        category: expense.category,
        referenceMonth: expense.referenceMonth,
      },
    };
  }

  private async executeCreateIncome(
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<IExecuteAgentActionResult> {
    const name = String(payload.name ?? '').trim();
    const amount = Number(payload.amount);
    const category = payload.category as EIncomeCategory;
    const referenceMonth = String(payload.referenceMonth ?? '').trim();
    const source = typeof payload.source === 'string' ? payload.source.trim() : undefined;

    try {
      IncomeServiceEntity.validateIncomeInput({
        userId,
        name,
        amount,
        category,
        referenceMonth,
        source,
      });
    } catch (error) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid income payload',
      } as IThrowedError;
    }

    const income = await this.incomeService.createIncome(userId, {
      userId,
      name,
      amount,
      category,
      referenceMonth,
      source,
    });

    await this.syncRagSafely(userId);

    return {
      success: true,
      message: `Entrada "${income.name}" cadastrada com sucesso.`,
      data: {
        id: income.id,
        name: income.name,
        amount: income.amount,
        category: income.category,
        referenceMonth: income.referenceMonth,
      },
    };
  }

  private async executeUpdateSalary(
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<IExecuteAgentActionResult> {
    const amount = Number(payload.amount);
    const currency = (payload.currency as ECurrency) ?? ECurrency.BRL;
    const paymentDay =
      payload.paymentDay !== undefined ? Number(payload.paymentDay) : undefined;
    const source = typeof payload.source === 'string' ? payload.source.trim() : undefined;

    try {
      UserServiceEntity.validateSalary({
        amount,
        currency,
        paymentDay,
        source,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid salary payload',
      } as IThrowedError;
    }

    const salary = await this.userService.updateSalary(userId, {
      amount,
      currency,
      paymentDay,
      source,
    });

    await this.syncRagSafely(userId);

    return {
      success: true,
      message: `Renda atualizada para R$ ${salary.amount.toFixed(2)}.`,
      data: {
        amount: salary.amount,
        currency: salary.currency,
        paymentDay: salary.paymentDay,
        source: salary.source,
      },
    };
  }

  private async syncRagSafely(userId: string): Promise<void> {
    try {
      await this.ragService.syncUserFinancialContext(userId);
    } catch {
      // RAG sync is best-effort after mutations
    }
  }

  private async removeProposedActionSafely(
    userId: string,
    conversationId: string,
    actionId: string,
  ): Promise<void> {
    try {
      await this.conversationService.removeProposedAction(userId, conversationId, actionId);
    } catch {
      // Best-effort cleanup of pending action metadata
    }
  }
}
