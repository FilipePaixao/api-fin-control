import { OnboardingController } from '../../application/controllers/onboarding.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { OnboardingActionServiceFactory } from './onboarding-action.service.factory';
import { OnboardingServiceFactory } from './onboarding.service.factory';

export class OnboardingControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new OnboardingController(
      OnboardingServiceFactory.create(),
      OnboardingActionServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
