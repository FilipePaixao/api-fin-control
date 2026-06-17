import { EAgentActionType } from '../entity/enums/EAgentActionType';

export type AgentMessageRole = 'user' | 'assistant';

export interface IAgentMessage {
  role: AgentMessageRole;
  content: string;
}

export interface IProposedAction {
  id: string;
  type: EAgentActionType;
  summary: string;
  payload: Record<string, unknown>;
}

export interface IAgentChatResponse {
  conversationId: string;
  message: IAgentMessage;
  proposedActions?: IProposedAction[];
}

export interface IAgentChatRequest {
  conversationId?: string;
  message: string;
}

export interface IExecuteAgentActionInput {
  type: EAgentActionType;
  payload: Record<string, unknown>;
}

export interface IExecuteAgentActionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface IAgentService {
  chat(userId: string, request: IAgentChatRequest): Promise<IAgentChatResponse>;
}

export interface IAgentActionService {
  executeAction(
    userId: string,
    input: { type?: unknown; payload?: unknown },
  ): Promise<IExecuteAgentActionResult>;
}
