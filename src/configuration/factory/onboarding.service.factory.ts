import { OnboardingService } from '../../domain/onboarding/service/onboarding.service';
import { loadOnboardingSystemPrompt } from '../../infraestructure/agent/onboarding-system-prompt.loader';
import { OllamaLlmProvider } from '../../infraestructure/agent/ollama-llm.provider';
import { ConversationServiceFactory } from './conversation.service.factory';
import { UserServiceFactory } from './user.service.factory';

export class OnboardingServiceFactory {
  static create(): OnboardingService {
    return new OnboardingService({
      llmProvider: new OllamaLlmProvider(),
      conversationService: ConversationServiceFactory.create(),
      userService: UserServiceFactory.create(),
      systemPrompt: loadOnboardingSystemPrompt(),
    });
  }
}
