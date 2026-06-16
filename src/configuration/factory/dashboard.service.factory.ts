import { DashboardService } from '../../domain/dashboard/service/dashboard.service';
import { ExpenseRepositoryRead } from '../../infraestructure/repository/expense/expense.repository.read';
import { UserRepositoryRead } from '../../infraestructure/repository/user/user.repository.read';

export class DashboardServiceFactory {
  static create(): DashboardService {
    return new DashboardService({
      userRepositoryRead: new UserRepositoryRead(),
      expenseRepositoryRead: new ExpenseRepositoryRead(),
    });
  }
}
