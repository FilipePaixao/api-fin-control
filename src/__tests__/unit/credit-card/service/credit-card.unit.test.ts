import { CreditCardService } from '../../../../domain/credit-card/service/credit-card.service';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { ICreditCard } from '../../../../domain/credit-card/entity/interfaces/credit-card.interface';
import { IExpenseService } from '../../../../domain/expense/interfaces/expense.service.interface';

function createRepos(overrides: ICreditCard[] = []) {
  const store: ICreditCard[] = [...overrides];

  return {
    store,
    read: {
      findById: jest.fn(async (id: string) => store.find((c) => c.id === id) ?? null),
      listByUserId: jest.fn(async (userId: string) => store.filter((c) => c.userId === userId)),
    },
    write: {
      create: jest.fn(async (card: ICreditCard) => {
        store.push(card);
        return card;
      }),
      updateById: jest.fn(async (id: string, payload: Partial<ICreditCard>) => {
        const index = store.findIndex((c) => c.id === id);
        if (index < 0) return null;
        store[index] = { ...store[index], ...payload };
        return store[index];
      }),
      deleteById: jest.fn(async (id: string) => {
        const index = store.findIndex((c) => c.id === id);
        if (index < 0) return null;
        const [removed] = store.splice(index, 1);
        return removed;
      }),
    },
  };
}

function createExpenseService(listResult: unknown[] = []): IExpenseService {
  return {
    createExpense: jest.fn(),
    createManyExpenses: jest.fn(),
    listExpenses: jest.fn().mockResolvedValue(listResult),
    getExpenseById: jest.fn(),
    updateExpenseById: jest.fn(),
    deleteExpenseById: jest.fn(),
    payExpenseById: jest.fn(),
    createInstallmentExpenses: jest.fn(),
    deleteInstallmentGroup: jest.fn(),
  };
}

describe('CreditCardService', () => {
  it('TC-01: creates and lists credit card', async () => {
    const repos = createRepos();
    const service = new CreditCardService({
      creditCardRepositoryRead: repos.read,
      creditCardRepositoryWrite: repos.write,
      expenseService: createExpenseService(),
    });

    const created = await service.create('user-1', {
      name: 'Nubank',
      lastFourDigits: '0506',
    });
    expect(created.name).toBe('Nubank');
    expect(created.lastFourDigits).toBe('0506');

    const listed = await service.list('user-1');
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(created.id);
  });

  it('TC-02: rejects invalid lastFourDigits', async () => {
    const repos = createRepos();
    const service = new CreditCardService({
      creditCardRepositoryRead: repos.read,
      creditCardRepositoryWrite: repos.write,
      expenseService: createExpenseService(),
    });

    await expect(
      service.create('user-1', { name: 'Nubank', lastFourDigits: '12' }),
    ).rejects.toMatchObject({ errorCode: EErrorCode.FIELD_INVALID });
  });

  it('TC-03: blocks delete when expenses exist', async () => {
    const card: ICreditCard = {
      id: 'card-1',
      userId: 'user-1',
      name: 'Nubank',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const repos = createRepos([card]);
    const expenseService = createExpenseService([{ id: 'exp-1' }]);
    const service = new CreditCardService({
      creditCardRepositoryRead: repos.read,
      creditCardRepositoryWrite: repos.write,
      expenseService,
    });

    await expect(service.delete('user-1', 'card-1')).rejects.toMatchObject({
      errorCode: EErrorCode.CREDIT_CARD_IN_USE,
    });
    expect(repos.write.deleteById).not.toHaveBeenCalled();
  });

  it('deletes when no linked expenses', async () => {
    const card: ICreditCard = {
      id: 'card-1',
      userId: 'user-1',
      name: 'Nubank',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const repos = createRepos([card]);
    const service = new CreditCardService({
      creditCardRepositoryRead: repos.read,
      creditCardRepositoryWrite: repos.write,
      expenseService: createExpenseService([]),
    });

    await service.delete('user-1', 'card-1');
    expect(repos.write.deleteById).toHaveBeenCalledWith('card-1');
  });
});
