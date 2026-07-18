import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { EAgentActionType } from '../../../../domain/agent/entity/enums/EAgentActionType';
import { AgentActionService } from '../../../../domain/agent/service/agent-action.service';
import { IConversationService } from '../../../../domain/agent/interfaces/conversation.service.interface';
import { IExpenseService } from '../../../../domain/expense/interfaces/expense.service.interface';
import { IRagService } from '../../../../domain/rag/interfaces/rag.service.interface';
import { IIncomeService } from '../../../../domain/income/interfaces/income.service.interface';
import { IUserService } from '../../../../domain/user/interfaces/user.service.interface';

function createIncomeServiceMock(
  override: Partial<IIncomeService> = {},
): IIncomeService {
  return {
    createIncome: jest.fn(),
    listIncomes: jest.fn(),
    getIncomeById: jest.fn(),
    updateIncomeById: jest.fn(),
    deleteIncomeById: jest.fn(),
    receiveIncomeById: jest.fn(),
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
    createInstallmentExpenses: jest.fn(),
    deleteInstallmentGroup: jest.fn(),
    ...override,
  };
}

function createUserServiceMock(override: Partial<IUserService> = {}): IUserService {
  return {
    createUser: jest.fn(),
    getUserById: jest.fn(),
    getUserByEmail: jest.fn(),
    updateUserById: jest.fn(),
    deleteUserById: jest.fn(),
    listUsers: jest.fn(),
    updateSalary: jest.fn(),
    getAuthenticatedProfile: jest.fn(),
    updateProfileAddress: jest.fn(),
    updateProfile: jest.fn(),
    getOnboardingStatus: jest.fn(),
    completeOnboarding: jest.fn(),
    ...override,
  };
}

function createRagServiceMock(override: Partial<IRagService> = {}): IRagService {
  return {
    syncUserFinancialContext: jest.fn(),
    syncExpense: jest.fn(),
    removeExpense: jest.fn(),
    searchExpenses: jest.fn(),
    askFinancialQuestion: jest.fn(),
    ...override,
  };
}

function createConversationServiceMock(
  override: Partial<IConversationService> = {},
): IConversationService {
  return {
    createConversation: jest.fn(),
    listConversations: jest.fn(),
    getConversationWithMessages: jest.fn(),
    renameConversation: jest.fn(),
    deleteConversation: jest.fn(),
    appendMessage: jest.fn(),
    getRecentMessages: jest.fn(),
    assertConversationOwnership: jest.fn(),
    updateConversationAfterMessage: jest.fn(),
    removeProposedAction: jest.fn(),
    getOrCreateOnboardingConversation: jest.fn(),
    ...override,
  };
}

describe('When executing CREATE_EXPENSE action in AgentActionService', () => {
  it('Should create expense and sync RAG context', async () => {
    const expenseService = createExpenseServiceMock({
      createExpense: jest.fn().mockResolvedValue({
        id: 'exp-1',
        name: 'Mercado',
        amount: 150,
        category: EExpenseCategory.FOOD,
        referenceMonth: '2026-06',
        status: EExpenseStatus.PENDING,
      }),
    });
    const ragService = createRagServiceMock();

    const service = new AgentActionService({
      expenseService,
      incomeService: createIncomeServiceMock(),
      userService: createUserServiceMock(),
      ragService,
      conversationService: createConversationServiceMock(),
    });

    const result = await service.executeAction('user-1', {
      type: EAgentActionType.CREATE_EXPENSE,
      payload: {
        name: 'Mercado',
        amount: 150,
        category: EExpenseCategory.FOOD,
        referenceMonth: '2026-06',
      },
    });

    expect(result.success).toBe(true);
    expect(expenseService.createExpense).toHaveBeenCalled();
    expect(ragService.syncUserFinancialContext).toHaveBeenCalledWith('user-1');
  });

  it('Should remove proposed action metadata when conversation and action ids are provided', async () => {
    const expenseService = createExpenseServiceMock({
      createExpense: jest.fn().mockResolvedValue({
        id: 'exp-1',
        name: 'Mercado',
        amount: 150,
        category: EExpenseCategory.FOOD,
        referenceMonth: '2026-06',
        status: EExpenseStatus.PENDING,
      }),
    });
    const conversationService = createConversationServiceMock();

    const service = new AgentActionService({
      expenseService,
      incomeService: createIncomeServiceMock(),
      userService: createUserServiceMock(),
      ragService: createRagServiceMock(),
      conversationService,
    });

    await service.executeAction('user-1', {
      type: EAgentActionType.CREATE_EXPENSE,
      conversationId: 'conv-1',
      actionId: 'action-1',
      payload: {
        name: 'Mercado',
        amount: 150,
        category: EExpenseCategory.FOOD,
        referenceMonth: '2026-06',
      },
    });

    expect(conversationService.removeProposedAction).toHaveBeenCalledWith(
      'user-1',
      'conv-1',
      'action-1',
    );
  });
});

describe('When executing UPDATE_SALARY action in AgentActionService', () => {
  it('Should update salary and sync RAG context', async () => {
    const userService = createUserServiceMock({
      updateSalary: jest.fn().mockResolvedValue({
        amount: 5000,
        currency: ECurrency.BRL,
        paymentDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    const ragService = createRagServiceMock();

    const service = new AgentActionService({
      expenseService: createExpenseServiceMock(),
      incomeService: createIncomeServiceMock(),
      userService,
      ragService,
      conversationService: createConversationServiceMock(),
    });

    const result = await service.executeAction('user-1', {
      type: EAgentActionType.UPDATE_SALARY,
      payload: { amount: 5000, currency: ECurrency.BRL, paymentDay: 5 },
    });

    expect(result.success).toBe(true);
    expect(userService.updateSalary).toHaveBeenCalledWith('user-1', {
      amount: 5000,
      currency: ECurrency.BRL,
      paymentDay: 5,
    });
    expect(ragService.syncUserFinancialContext).toHaveBeenCalledWith('user-1');
  });
});

describe('When executing action with invalid expense payload in AgentActionService', () => {
  it('Should reject with FIELD_INVALID', async () => {
    const service = new AgentActionService({
      expenseService: createExpenseServiceMock(),
      incomeService: createIncomeServiceMock(),
      userService: createUserServiceMock(),
      ragService: createRagServiceMock(),
      conversationService: createConversationServiceMock(),
    });

    await expect(
      service.executeAction('user-1', {
        type: EAgentActionType.CREATE_EXPENSE,
        payload: { name: '', amount: -1, category: 'INVALID', referenceMonth: 'bad' },
      }),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.FIELD_INVALID,
    });
  });
});

describe('When executing action with invalid type in AgentActionService', () => {
  it('Should reject with FIELD_INVALID', async () => {
    const service = new AgentActionService({
      expenseService: createExpenseServiceMock(),
      incomeService: createIncomeServiceMock(),
      userService: createUserServiceMock(),
      ragService: createRagServiceMock(),
      conversationService: createConversationServiceMock(),
    });

    await expect(
      service.executeAction('user-1', { type: 'INVALID', payload: {} }),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.FIELD_INVALID,
    });
  });
});

describe('When executing action with invalid payload in AgentActionService', () => {
  it('Should reject with FIELD_INVALID', async () => {
    const service = new AgentActionService({
      expenseService: createExpenseServiceMock(),
      incomeService: createIncomeServiceMock(),
      userService: createUserServiceMock(),
      ragService: createRagServiceMock(),
      conversationService: createConversationServiceMock(),
    });

    await expect(
      service.executeAction('user-1', {
        type: EAgentActionType.CREATE_EXPENSE,
        payload: null,
      }),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.FIELD_INVALID,
    });
  });
});
