import { AuthController } from '../../application/controllers/auth.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { AuthServiceFactory } from './auth.service.factory';
import { UserServiceFactory } from './user.service.factory';

export class AuthControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();

    return new AuthController(
      AuthServiceFactory.create(),
      UserServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
