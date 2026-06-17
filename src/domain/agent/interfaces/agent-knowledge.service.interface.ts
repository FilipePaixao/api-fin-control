export interface IAgentKnowledgeService {
  searchGlobalKnowledge(query: string, limit: number): Promise<string[]>;
  extractAndIndexGlobalInsight(
    userMessage: string,
    assistantMessage: string,
  ): Promise<void>;
}
