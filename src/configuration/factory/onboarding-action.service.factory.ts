import { OnboardingActionService } from '../../domain/onboarding/service/onboarding-action.service';
import { UserServiceFactory } from './user.service.factory';

export class OnboardingActionServiceFactory {
  static create(): OnboardingActionService {
    return new OnboardingActionService({
      userService: UserServiceFactory.create(),
    });
  }
}
