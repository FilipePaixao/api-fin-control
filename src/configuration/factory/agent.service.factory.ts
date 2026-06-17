import { AgentService } from '../../domain/agent/service/agent.service';
import { DashboardServiceFactory } from './dashboard.service.factory';
import { ExpenseServiceFactory } from './expense.service.factory';
import { OllamaLlmProvider } from '../../infraestructure/agent/ollama-llm.provider';

export class AgentServiceFactory {
  static create(): AgentService {
    return new AgentService({
      llmProvider: new OllamaLlmProvider(),
      dashboardService: DashboardServiceFactory.create(),
      expenseService: ExpenseServiceFactory.create(),
    });
  }
}
