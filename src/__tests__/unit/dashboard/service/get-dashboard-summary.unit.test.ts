import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { DashboardService } from '../../../../domain/dashboard/service/dashboard.service';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import {
  createExpenseRepositoryReadMock,
  createUserRepositoryReadMock,
} from '../../helpers/service-mocks.helper';

describe('When getting dashboard summary with salary and expenses', () => {
  it('Should aggregate salary and expenses correctly', async () => {
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'user-1@email.com',
        salary: {
          amount: 5000,
          currency: ECurrency.BRL,
        },
      }),
    });
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpenses: jest.fn().mockResolvedValue([
        {
          id: 'expense-1',
          userId: 'user-1',
          name: 'Rent',
          amount: 1800,
          category: EExpenseCategory.HOUSING,
          status: EExpenseStatus.PAID,
          referenceMonth: '2026-06',
          createdAt: new Date(),
        },
        {
          id: 'expense-2',
          userId: 'user-1',
          name: 'Market',
          amount: 600,
          category: EExpenseCategory.FOOD,
          status: EExpenseStatus.PENDING,
          referenceMonth: '2026-06',
          createdAt: new Date(),
        },
      ]),
    });

    const service = new DashboardService({
      userRepositoryRead,
      expenseRepositoryRead,
    });

    const summary = await service.getDashboardSummary('user-1', '2026-06');

    expect(userRepositoryRead.findUserById).toHaveBeenCalledWith('user-1');
    expect(expenseRepositoryRead.listExpenses).toHaveBeenCalledWith({
      userId: 'user-1',
      referenceMonth: '2026-06',
    });
    expect(summary.salary).toBe(5000);
    expect(summary.currency).toBe(ECurrency.BRL);
    expect(summary.totalExpenses).toBe(2400);
    expect(summary.totalPaid).toBe(1800);
    expect(summary.totalPending).toBe(600);
    expect(summary.totalOverdue).toBe(0);
    expect(summary.availableBalance).toBe(3200);
    expect(summary.incomeCommitmentPercent).toBe(36);
    expect(summary.topExpenses[0].name).toBe('Rent');
  });
});

describe('When getting dashboard summary without salary', () => {
  it('Should return nullable salary fields and keep expense totals', async () => {
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'user-1@email.com',
      }),
    });
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpenses: jest.fn().mockResolvedValue([
        {
          id: 'expense-1',
          userId: 'user-1',
          name: 'Internet',
          amount: 180,
          category: EExpenseCategory.SUBSCRIPTIONS,
          status: EExpenseStatus.PAID,
          referenceMonth: '2026-06',
          createdAt: new Date(),
        },
      ]),
    });

    const service = new DashboardService({
      userRepositoryRead,
      expenseRepositoryRead,
    });

    const summary = await service.getDashboardSummary('user-1');

    expect(summary.salary).toBeNull();
    expect(summary.currency).toBeNull();
    expect(summary.availableBalance).toBeNull();
    expect(summary.incomeCommitmentPercent).toBeNull();
    expect(summary.totalExpenses).toBe(180);
    expect(summary.totalPaid).toBe(180);
  });
});

describe('When getting dashboard summary without expenses', () => {
  it('Should return zeroed totals and empty top expenses', async () => {
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'user-1@email.com',
        salary: {
          amount: 3500,
          currency: ECurrency.BRL,
        },
      }),
    });
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      listExpenses: jest.fn().mockResolvedValue([]),
    });

    const service = new DashboardService({
      userRepositoryRead,
      expenseRepositoryRead,
    });

    const summary = await service.getDashboardSummary('user-1', '2026-07');

    expect(summary.totalExpenses).toBe(0);
    expect(summary.totalPaid).toBe(0);
    expect(summary.totalPending).toBe(0);
    expect(summary.totalOverdue).toBe(0);
    expect(summary.availableBalance).toBe(3500);
    expect(summary.incomeCommitmentPercent).toBe(0);
    expect(summary.topExpenses).toEqual([]);
    expect(summary.byCategory).toHaveLength(Object.values(EExpenseCategory).length);
    expect(summary.byCategory.every((categorySummary) => categorySummary.total === 0)).toBe(
      true,
    );
  });
});
