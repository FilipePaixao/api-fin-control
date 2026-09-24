import { CreditCardController } from '../../application/controllers/credit-card.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { CreditCardServiceFactory } from './credit-card.service.factory';

export class CreditCardControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new CreditCardController(
      CreditCardServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
