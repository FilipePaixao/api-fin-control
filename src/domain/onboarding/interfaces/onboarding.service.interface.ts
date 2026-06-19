import { IAgentChatRequest, IAgentChatResponse } from '../../agent/interfaces/agent.service.interface';

export interface IOnboardingService {
  chat(userId: string, request: IAgentChatRequest): Promise<IAgentChatResponse>;
}
