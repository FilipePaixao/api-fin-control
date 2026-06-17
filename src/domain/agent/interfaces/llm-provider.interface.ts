export type LlmMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ILlmToolCall {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ILlmMessage {
  role: LlmMessageRole;
  content: string;
  toolCalls?: ILlmToolCall[];
  toolName?: string;
}

export interface ILlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ILlmChatRequest {
  messages: ILlmMessage[];
  tools?: ILlmToolDefinition[];
}

export interface ILlmChatResponse {
  message: ILlmMessage;
  done: boolean;
}

export interface ILlmProvider {
  chat(request: ILlmChatRequest): Promise<ILlmChatResponse>;
}
