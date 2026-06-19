import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  OLLAMA_NUM_CTX,
  OLLAMA_TIMEOUT_MS,
} from '../../configuration/env-constants/env.constants';
import {
  ILlmChatRequest,
  ILlmChatResponse,
  ILlmMessage,
  ILlmProvider,
  ILlmToolCall,
} from '../../domain/agent/interfaces/llm-provider.interface';

interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
}

export class OllamaLlmProvider implements ILlmProvider {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly numCtx: number;

  constructor(
    baseUrl = OLLAMA_BASE_URL,
    model = OLLAMA_MODEL,
    timeoutMs = OLLAMA_TIMEOUT_MS,
    numCtx = OLLAMA_NUM_CTX,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.numCtx = numCtx;
  }

  async chat(request: ILlmChatRequest): Promise<ILlmChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages.map((message) => this.toOllamaMessage(message)),
          tools: request.tools?.map((tool) => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          })),
          options: { num_ctx: this.numCtx },
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Ollama request failed (${response.status}): ${body || response.statusText}`,
        );
      }

      const data = (await response.json()) as OllamaChatResponse;
      return {
        message: this.fromOllamaMessage(data.message),
        done: data.done,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Ollama request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private toOllamaMessage(message: ILlmMessage): Record<string, unknown> {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        content: message.content,
        tool_name: message.toolName,
      };
    }

    const ollamaMessage: Record<string, unknown> = {
      role: message.role,
      content: message.content,
    };

    if (message.toolCalls?.length) {
      ollamaMessage.tool_calls = message.toolCalls.map((toolCall) => ({
        function: {
          name: toolCall.name,
          arguments: toolCall.arguments,
        },
      }));
    }

    return ollamaMessage;
  }

  private fromOllamaMessage(message: OllamaChatResponse['message']): ILlmMessage {
    const toolCalls: ILlmToolCall[] | undefined = message.tool_calls?.map(
      (toolCall, index) => ({
        id: `call-${index}`,
        name: toolCall.function.name,
        arguments: toolCall.function.arguments ?? {},
      }),
    );

    return {
      role: message.role as ILlmMessage['role'],
      content: message.content ?? '',
      toolCalls: toolCalls?.length ? toolCalls : undefined,
    };
  }
}
