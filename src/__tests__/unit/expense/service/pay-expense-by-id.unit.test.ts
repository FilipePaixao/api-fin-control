import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { EPaymentMethod } from '../../../../domain/expense/entity/enums/EPaymentMethod';
import { ExpenseService } from '../../../../domain/expense/service/expense.service';
import {
  createExpenseRepositoryReadMock,
  createExpenseRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When paying expense by id from owner user', () => {
  it('Should return the paid expense', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      findExpenseById: jest.fn().mockResolvedValue({
        id: 'expense-1',
        userId: 'user-1',
        name: 'Energy',
        amount: 180,
        category: EExpenseCategory.HOUSING,
        status: EExpenseStatus.PENDING,
        referenceMonth: '2026-06',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock({
      updateExpenseById: jest.fn().mockResolvedValue({
        id: 'expense-1',
        userId: 'user-1',
        name: 'Energy',
        amount: 180,
        category: EExpenseCategory.HOUSING,
        status: EExpenseStatus.PAID,
        paymentMethod: EPaymentMethod.PIX,
        paidAt: new Date(),
        referenceMonth: '2026-06',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    const result = await expenseService.payExpenseById('user-1', 'expense-1', {
      paymentMethod: EPaymentMethod.PIX,
    });

    expect(result).toMatchObject({
      id: 'expense-1',
      status: EExpenseStatus.PAID,
      paymentMethod: EPaymentMethod.PIX,
    });
  });
});

describe('When paying expense by id from another user', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const expenseRepositoryRead = createExpenseRepositoryReadMock({
      findExpenseById: jest.fn().mockResolvedValue({
        id: 'expense-1',
        userId: 'owner-user',
        name: 'Energy',
        amount: 180,
        category: EExpenseCategory.HOUSING,
        status: EExpenseStatus.PENDING,
        referenceMonth: '2026-06',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    const expenseRepositoryWrite = createExpenseRepositoryWriteMock();
    const expenseService = new ExpenseService({
      expenseRepositoryRead,
      expenseRepositoryWrite,
    });

    await expect(
      expenseService.payExpenseById('intruder-user', 'expense-1', {}),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { expenseId: 'expense-1' },
    });
  });
});
