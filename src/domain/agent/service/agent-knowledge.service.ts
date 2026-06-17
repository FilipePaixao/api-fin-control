import { randomUUID } from 'crypto';
import { EEmbeddingSourceType } from '../../rag/entity/enums/EEmbeddingSourceType';
import { IEmbeddingProvider } from '../../rag/interfaces/embedding-provider.interface';
import { IAgentKnowledgeService } from '../interfaces/agent-knowledge.service.interface';
import { ILlmProvider } from '../interfaces/llm-provider.interface';
import { IGlobalKnowledgeRepository } from '../repository/global-knowledge.repository';

const EXTRACTION_PROMPT = `Analise a troca abaixo entre usuário e assistente financeiro.
Extraia APENAS uma dica ou padrão geral de educação financeira que possa ajudar qualquer pessoa.
Regras:
- Não inclua nomes, valores monetários, emails, CPF, IDs ou dados pessoais.
- Não mencione situação específica de uma pessoa.
- Se não houver conhecimento geral útil, responda exatamente: NONE
- Resposta em português, uma frase curta.`;

const PII_PATTERNS = [
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/i,
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
  /\bR\$\s?\d+([.,]\d+)?\b/i,
  /\buser[-_]?\d+\b/i,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
];

interface IParamsAgentKnowledgeService {
  llmProvider: ILlmProvider;
  embeddingProvider: IEmbeddingProvider;
  globalKnowledgeRepository: IGlobalKnowledgeRepository;
}

export class AgentKnowledgeService implements IAgentKnowledgeService {
  private readonly llmProvider: ILlmProvider;
  private readonly embeddingProvider: IEmbeddingProvider;
  private readonly globalKnowledgeRepository: IGlobalKnowledgeRepository;

  constructor({
    llmProvider,
    embeddingProvider,
    globalKnowledgeRepository,
  }: IParamsAgentKnowledgeService) {
    this.llmProvider = llmProvider;
    this.embeddingProvider = embeddingProvider;
    this.globalKnowledgeRepository = globalKnowledgeRepository;
  }

  async searchGlobalKnowledge(query: string, limit: number): Promise<string[]> {
    if (!query.trim()) {
      return [];
    }

    const queryEmbedding = await this.embeddingProvider.embed(query);
    const results = await this.globalKnowledgeRepository.search(queryEmbedding, limit);
    return results.map((result) => result.document.content);
  }

  async extractAndIndexGlobalInsight(
    userMessage: string,
    assistantMessage: string,
  ): Promise<void> {
    try {
      const insight = await this.extractGeneralInsight(userMessage, assistantMessage);
      if (!insight || !this.isSafeForGlobalIndex(insight)) {
        return;
      }

      const embedding = await this.embeddingProvider.embed(insight);
      await this.globalKnowledgeRepository.upsert(
        {
          id: randomUUID(),
          sourceType: EEmbeddingSourceType.CONVERSATION_INSIGHT,
          content: insight,
          metadata: { topic: 'financial_education' },
          createdAt: new Date(),
        },
        embedding,
      );
    } catch {
      // best-effort — não propaga para o fluxo de chat
    }
  }

  isSafeForGlobalIndex(content: string): boolean {
    const normalizedContent = content.trim();
    if (!normalizedContent || normalizedContent.toUpperCase() === 'NONE') {
      return false;
    }

    return !PII_PATTERNS.some((pattern) => pattern.test(normalizedContent));
  }

  private async extractGeneralInsight(
    userMessage: string,
    assistantMessage: string,
  ): Promise<string | null> {
    const response = await this.llmProvider.chat({
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        {
          role: 'user',
          content: `Usuário: ${userMessage}\nAssistente: ${assistantMessage}`,
        },
      ],
    });

    const insight = response.message.content.trim();
    if (!insight || insight.toUpperCase() === 'NONE') {
      return null;
    }

    return insight;
  }
}
