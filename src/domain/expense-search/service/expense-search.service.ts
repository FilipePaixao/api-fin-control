import { IExpenseRepositoryRead } from '../../expense/repository/expense.repository.read';
import { IExpenseFilters } from '../../expense/interfaces/expense.service.interface';
import { IExpense } from '../../expense/entity/interfaces/expense.interface';
import { IRagService } from '../../rag/interfaces/rag.service.interface';
import { IExpenseIndexRepository } from '../interfaces/expense-index.repository';
import {
  IExpenseSearchService,
  toExpenseIndexFilters,
} from '../interfaces/expense-search.service.interface';
import { reciprocalRankFusion } from '../utils/reciprocal-rank-fusion.utils';

const SEARCH_RESULT_LIMIT = 50;

interface IParamsExpenseSearchService {
  expenseRepositoryRead: IExpenseRepositoryRead;
  expenseIndexRepository: IExpenseIndexRepository;
  ragService: IRagService;
}

export class ExpenseSearchService implements IExpenseSearchService {
  private readonly expenseRepositoryRead: IExpenseRepositoryRead;
  private readonly expenseIndexRepository: IExpenseIndexRepository;
  private readonly ragService: IRagService;

  constructor({
    expenseRepositoryRead,
    expenseIndexRepository,
    ragService,
  }: IParamsExpenseSearchService) {
    this.expenseRepositoryRead = expenseRepositoryRead;
    this.expenseIndexRepository = expenseIndexRepository;
    this.ragService = ragService;
  }

  async searchExpenses(userId: string, filters: IExpenseFilters): Promise<IExpense[]> {
    const search = filters.search?.trim();
    if (!search) {
      return this.expenseRepositoryRead.listExpenses({
        userId,
        category: filters.category,
        status: filters.status,
        referenceMonth: filters.referenceMonth,
        from: filters.from,
        to: filters.to,
      });
    }

    const indexFilters = toExpenseIndexFilters(filters);
    const [lexicalIds, semanticIds] = await Promise.all([
      this.expenseIndexRepository.search(userId, search, indexFilters, SEARCH_RESULT_LIMIT),
      this.ragService.searchExpenses(userId, search, indexFilters, SEARCH_RESULT_LIMIT),
    ]);

    const mergedIds = reciprocalRankFusion([lexicalIds, semanticIds]);
    if (!mergedIds.length) {
      return [];
    }

    const expenses = await this.expenseRepositoryRead.findExpensesByIds(userId, mergedIds);
    const expensesById = new Map(expenses.map((expense) => [expense.id, expense]));

    return mergedIds
      .map((expenseId) => expensesById.get(expenseId))
      .filter((expense): expense is IExpense => Boolean(expense));
  }
}
