import { DashboardController } from '../../application/controllers/dashboard.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { DashboardServiceFactory } from './dashboard.service.factory';

export class DashboardControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new DashboardController(
      DashboardServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
