import { AgentKnowledgeService } from '../../domain/agent/service/agent-knowledge.service';
import { AgentTrainingExportService } from '../../domain/agent/service/agent-training-export.service';
import {
  AGENT_FINE_TUNE_MIN_SAMPLES,
  AGENT_FINE_TUNE_MODEL_TAG,
} from '../env-constants/env.constants';
import { OllamaLlmProvider } from '../../infraestructure/agent/ollama-llm.provider';
import { MockEmbeddingProvider } from '../../infraestructure/rag/mock-embedding.provider';
import { AgentModelVersionRepositoryWrite } from '../../infraestructure/repository/agent/agent-model-version.repository.write';
import { ChatMessageRepositoryRead } from '../../infraestructure/repository/agent/chat-message.repository.read';
import { ChatMessageRepositoryWrite } from '../../infraestructure/repository/agent/chat-message.repository.write';
import { PgGlobalKnowledgeRepository } from '../../infraestructure/repository/rag/pg-global-knowledge.repository';

export class AgentKnowledgeServiceFactory {
  static create(): AgentKnowledgeService {
    return new AgentKnowledgeService({
      llmProvider: new OllamaLlmProvider(),
      embeddingProvider: new MockEmbeddingProvider(),
      globalKnowledgeRepository: new PgGlobalKnowledgeRepository(),
    });
  }
}

export class AgentTrainingExportServiceFactory {
  static create(): AgentTrainingExportService {
    return new AgentTrainingExportService({
      chatMessageRepositoryRead: new ChatMessageRepositoryRead(),
      chatMessageRepositoryWrite: new ChatMessageRepositoryWrite(),
      agentModelVersionRepositoryWrite: new AgentModelVersionRepositoryWrite(),
      minSamples: AGENT_FINE_TUNE_MIN_SAMPLES,
      modelTag: AGENT_FINE_TUNE_MODEL_TAG,
    });
  }
}
