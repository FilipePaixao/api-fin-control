import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { EAgentActionType } from '../../../../domain/agent/entity/enums/EAgentActionType';
import { AgentActionService } from '../../../../domain/agent/service/agent-action.service';
import { IExpenseService } from '../../../../domain/expense/interfaces/expense.service.interface';
import { IRagService } from '../../../../domain/rag/interfaces/rag.service.interface';
import { IUserService } from '../../../../domain/user/interfaces/user.service.interface';

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
    ...override,
  };
}

function createRagServiceMock(override: Partial<IRagService> = {}): IRagService {
  return {
    syncUserFinancialContext: jest.fn(),
    askFinancialQuestion: jest.fn(),
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
      userService: createUserServiceMock(),
      ragService,
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
      userService,
      ragService,
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
      userService: createUserServiceMock(),
      ragService: createRagServiceMock(),
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
      userService: createUserServiceMock(),
      ragService: createRagServiceMock(),
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
      userService: createUserServiceMock(),
      ragService: createRagServiceMock(),
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
