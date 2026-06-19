import { AgentService } from '../../domain/agent/service/agent.service';
import { loadAgentSystemPrompt } from '../../infraestructure/agent/agent-system-prompt.loader';
import { OllamaLlmProvider } from '../../infraestructure/agent/ollama-llm.provider';
import { AgentKnowledgeServiceFactory } from './agent-knowledge.service.factory';
import { ConversationServiceFactory } from './conversation.service.factory';
import { DashboardServiceFactory } from './dashboard.service.factory';
import { ExpenseServiceFactory } from './expense.service.factory';
import { RegionalEconomicsServiceFactory } from './regional-economics.service.factory';
import { UserRepositoryRead } from '../../infraestructure/repository/user/user.repository.read';

export class AgentServiceFactory {
  static create(): AgentService {
    return new AgentService({
      llmProvider: new OllamaLlmProvider(),
      dashboardService: DashboardServiceFactory.create(),
      expenseService: ExpenseServiceFactory.create(),
      conversationService: ConversationServiceFactory.create(),
      userRepositoryRead: new UserRepositoryRead(),
      systemPrompt: loadAgentSystemPrompt(),
      agentKnowledgeService: AgentKnowledgeServiceFactory.create(),
      regionalEconomicsService: RegionalEconomicsServiceFactory.create(),
    });
  }
}
