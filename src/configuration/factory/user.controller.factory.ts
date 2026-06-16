import { UserController } from '../../application/controllers/user.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { UserServiceFactory } from './user.service.factory';

export class UserControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new UserController(
      UserServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
