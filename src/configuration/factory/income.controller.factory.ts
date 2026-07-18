import { IncomeController } from '../../application/controllers/income.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { IncomeServiceFactory } from './income.service.factory';

export class IncomeControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new IncomeController(
      IncomeServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
