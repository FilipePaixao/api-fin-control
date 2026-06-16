import { ExpenseController } from '../../application/controllers/expense.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { ExpenseServiceFactory } from './expense.service.factory';

export class ExpenseControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new ExpenseController(
      ExpenseServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
