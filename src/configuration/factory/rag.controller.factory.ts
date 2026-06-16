import { RagController } from '../../application/controllers/rag.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { RagServiceFactory } from './rag.service.factory';

export class RagControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new RagController(
      RagServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
