import { StatementImportController } from '../../application/controllers/statement-import.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { StatementImportServiceFactory } from './statement-import.service.factory';

export class StatementImportControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new StatementImportController(
      StatementImportServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
