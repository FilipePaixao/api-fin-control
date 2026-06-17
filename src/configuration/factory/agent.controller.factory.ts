import { AgentController } from '../../application/controllers/agent.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { AgentActionServiceFactory } from './agent-action.service.factory';
import { AgentServiceFactory } from './agent.service.factory';
import { ConversationServiceFactory } from './conversation.service.factory';

export class AgentControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new AgentController(
      AgentServiceFactory.create(),
      AgentActionServiceFactory.create(),
      ConversationServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
