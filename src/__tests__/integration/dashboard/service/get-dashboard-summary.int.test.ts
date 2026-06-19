import { DashboardServiceFactory } from '../../../../configuration/factory/dashboard.service.factory';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { ExpenseModel } from '../../../../infraestructure/db/mongo/models/expense.model';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { validUserMock } from '../../../__mocks__/user.mock';

const dashboardService = DashboardServiceFactory.create();

describe('When getting dashboard summary with persisted salary and expenses', () => {
  it('Should aggregate only the selected reference month', async () => {
    const user = validUserMock({
      salary: {
        amount: 7000,
        currency: ECurrency.BRL,
        paymentDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await UserModel.create(user);

    await ExpenseModel.insertMany([
      {
        id: 'expense-month-a',
        userId: user.id,
        name: 'Rent',
        amount: 2200,
        category: EExpenseCategory.HOUSING,
        status: EExpenseStatus.PAID,
        referenceMonth: '2026-06',
      },
      {
        id: 'expense-month-b',
        userId: user.id,
        name: 'Gym',
        amount: 150,
        category: EExpenseCategory.HEALTH,
        status: EExpenseStatus.PENDING,
        referenceMonth: '2026-05',
      },
    ]);

    const summary = await dashboardService.getDashboardSummary(user.id, '2026-06');

    expect(summary.salary).toBe(7000);
    expect(summary.currency).toBe(ECurrency.BRL);
    expect(summary.totalExpenses).toBe(2200);
    expect(summary.totalPaid).toBe(2200);
    expect(summary.totalPending).toBe(0);
    expect(summary.availableBalance).toBe(4800);
    expect(summary.topExpenses[0].name).toBe('Rent');
  });
});

describe('When getting dashboard summary for user without salary and expenses', () => {
  it('Should return nullable salary and zero totals', async () => {
    const user = validUserMock();
    await UserModel.create(user);

    const summary = await dashboardService.getDashboardSummary(user.id, '2026-06');

    expect(summary.salary).toBeNull();
    expect(summary.currency).toBeNull();
    expect(summary.totalExpenses).toBe(0);
    expect(summary.totalPaid).toBe(0);
    expect(summary.totalPending).toBe(0);
    expect(summary.totalOverdue).toBe(0);
    expect(summary.availableBalance).toBeNull();
    expect(summary.topExpenses).toEqual([]);
  });
});
