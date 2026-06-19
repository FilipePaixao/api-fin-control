import { AgentActionService } from '../../domain/agent/service/agent-action.service';
import { ConversationServiceFactory } from './conversation.service.factory';
import { ExpenseServiceFactory } from './expense.service.factory';
import { RagServiceFactory } from './rag.service.factory';
import { UserServiceFactory } from './user.service.factory';

export class AgentActionServiceFactory {
  static create(): AgentActionService {
    return new AgentActionService({
      expenseService: ExpenseServiceFactory.create(),
      userService: UserServiceFactory.create(),
      ragService: RagServiceFactory.create(),
      conversationService: ConversationServiceFactory.create(),
    });
  }
}
