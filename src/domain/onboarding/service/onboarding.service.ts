import { randomUUID } from 'crypto';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { EAgentActionType } from '../../agent/entity/enums/EAgentActionType';
import { EChatMessageRole } from '../../agent/entity/enums/EChatMessageRole';
import {
  IAgentChatRequest,
  IAgentChatResponse,
  IProposedAction,
} from '../../agent/interfaces/agent.service.interface';
import { IConversationService } from '../../agent/interfaces/conversation.service.interface';
import { ILlmMessage, ILlmProvider } from '../../agent/interfaces/llm-provider.interface';
import { EUserVerificationStatus } from '../../user/entity/enums/EUserVerificationStatus';
import { EInvestmentProfile } from '../../user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../user/entity/enums/ELivingSituation';
import { OnboardingField } from '../../user/entity/interfaces/user-profile.interface';
import { IUserService } from '../../user/interfaces/user.service.interface';
import {
  assertFieldAllowedForStatus,
  assertStatusAllowsCompletion,
  buildStepContext,
  getExpectedField,
  resolveVerificationStatus,
} from '../../user/utils/user-verification-state.utils';
import { getOnboardingToolsForStatus } from '../tools/onboarding-tools';
import { IOnboardingService } from '../interfaces/onboarding.service.interface';

const MAX_ONBOARDING_ITERATIONS = 5;
const MAX_HISTORY_MESSAGES = 20;

interface IParamsOnboardingService {
  llmProvider: ILlmProvider;
  conversationService: IConversationService;
  userService: IUserService;
  systemPrompt: string;
}

export class OnboardingService implements IOnboardingService {
  private readonly llmProvider: ILlmProvider;
  private readonly conversationService: IConversationService;
  private readonly userService: IUserService;
  private readonly systemPrompt: string;

  constructor({
    llmProvider,
    conversationService,
    userService,
    systemPrompt,
  }: IParamsOnboardingService) {
    this.llmProvider = llmProvider;
    this.conversationService = conversationService;
    this.userService = userService;
    this.systemPrompt = systemPrompt;
  }

  async chat(userId: string, request: IAgentChatRequest): Promise<IAgentChatResponse> {
    const userMessageContent = request.message?.trim();
    if (!userMessageContent) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Message is required',
      } as IThrowedError;
    }

    const user = await this.userService.getUserById(userId);
    const verificationStatus = resolveVerificationStatus(user.profile);
    const stepContext = buildStepContext(verificationStatus);
    const onboardingTools = getOnboardingToolsForStatus(verificationStatus);

    const conversation =
      await this.conversationService.getOrCreateOnboardingConversation(userId);
    const conversationId = conversation.id;

    const existingMessages = await this.conversationService.getRecentMessages(
      userId,
      conversationId,
      MAX_HISTORY_MESSAGES,
    );
    const isFirstUserMessage = !existingMessages.some(
      (message) => message.role === EChatMessageRole.USER,
    );

    await this.conversationService.appendMessage({
      conversationId,
      userId,
      role: EChatMessageRole.USER,
      content: userMessageContent,
    });

    await this.conversationService.updateConversationAfterMessage(
      userId,
      conversationId,
      userMessageContent,
      isFirstUserMessage,
    );

    const storedMessages = await this.conversationService.getRecentMessages(
      userId,
      conversationId,
      MAX_HISTORY_MESSAGES,
    );

    const llmMessages: ILlmMessage[] = [
      { role: 'system', content: `${this.systemPrompt}\n\n${stepContext}` },
      ...storedMessages.map((message) => ({
        role: (message.role === EChatMessageRole.USER ? 'user' : 'assistant') as ILlmMessage['role'],
        content: message.content,
      })),
    ];

    const proposedActions: IProposedAction[] = [];

    if (!onboardingTools.length) {
      const assistantContent =
        verificationStatus === EUserVerificationStatus.COMPLETED
          ? 'Seu onboarding já foi concluído. Você pode usar o assistente financeiro.'
          : 'Complete o endereço no formulário anterior para continuar o onboarding.';

      await this.conversationService.appendMessage({
        conversationId,
        userId,
        role: EChatMessageRole.ASSISTANT,
        content: assistantContent,
      });

      return {
        conversationId,
        message: {
          role: 'assistant',
          content: assistantContent,
        },
      };
    }

    try {
      for (let iteration = 0; iteration < MAX_ONBOARDING_ITERATIONS; iteration += 1) {
        const response = await this.llmProvider.chat({
          messages: llmMessages,
          tools: onboardingTools,
        });

        const assistantMessage = response.message;
        llmMessages.push(assistantMessage);

        if (!assistantMessage.toolCalls?.length) {
          const assistantContent =
            assistantMessage.content.trim() ||
            'Olá! Vamos conhecer um pouco mais sobre você.';

          await this.conversationService.appendMessage({
            conversationId,
            userId,
            role: EChatMessageRole.ASSISTANT,
            content: assistantContent,
            proposedActions: proposedActions.length ? proposedActions : undefined,
          });

          return {
            conversationId,
            message: {
              role: 'assistant',
              content: assistantContent,
            },
            proposedActions: proposedActions.length ? proposedActions : undefined,
          };
        }

        for (const toolCall of assistantMessage.toolCalls) {
          const toolResult = await this.executeTool(
            verificationStatus,
            toolCall.name,
            toolCall.arguments,
            proposedActions,
          );
          llmMessages.push({
            role: 'tool',
            content: toolResult,
            toolName: toolCall.name,
          });
        }
      }

      const fallbackContent =
        'Precisei de mais etapas para continuar. Pode responder de forma mais direta?';

      await this.conversationService.appendMessage({
        conversationId,
        userId,
        role: EChatMessageRole.ASSISTANT,
        content: fallbackContent,
        proposedActions: proposedActions.length ? proposedActions : undefined,
      });

      return {
        conversationId,
        message: {
          role: 'assistant',
          content: fallbackContent,
        },
        proposedActions: proposedActions.length ? proposedActions : undefined,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'errorCode' in error &&
        'status' in error
      ) {
        throw error;
      }

      throw {
        status: 503,
        errorCode: EErrorCode.AGENT_LLM_UNAVAILABLE,
        message:
          error instanceof Error
            ? error.message
            : 'AI assistant is temporarily unavailable',
      } as IThrowedError;
    }
  }

  private async executeTool(
    verificationStatus: EUserVerificationStatus,
    toolName: string,
    args: Record<string, unknown>,
    proposedActions: IProposedAction[],
  ): Promise<string> {
    switch (toolName) {
      case 'propose_update_profile':
        return this.toolProposeUpdateProfile(verificationStatus, args, proposedActions);
      case 'propose_complete_onboarding':
        return this.toolProposeCompleteOnboarding(verificationStatus, proposedActions);
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  }

  private toolProposeUpdateProfile(
    verificationStatus: EUserVerificationStatus,
    args: Record<string, unknown>,
    proposedActions: IProposedAction[],
  ): string {
    const expectedField = getExpectedField(verificationStatus);
    if (!expectedField || expectedField === 'address') {
      return JSON.stringify({
        error: 'No profile field is expected at the current verification status',
        verificationStatus,
      });
    }

    const payload: Record<string, unknown> = {};
    let summary = 'Atualizar perfil';

    if (
      expectedField === 'occupationArea' &&
      typeof args.occupationArea === 'string' &&
      args.occupationArea.trim()
    ) {
      payload.occupationArea = args.occupationArea.trim();
      summary = `Salvar área de atuação: ${payload.occupationArea}`;
    } else if (
      expectedField === 'investmentProfile' &&
      typeof args.investmentProfile === 'string' &&
      Object.values(EInvestmentProfile).includes(args.investmentProfile as EInvestmentProfile)
    ) {
      payload.investmentProfile = args.investmentProfile;
      summary = `Salvar perfil de investimento: ${payload.investmentProfile}`;
    } else if (
      expectedField === 'livingSituation' &&
      typeof args.livingSituation === 'string' &&
      Object.values(ELivingSituation).includes(args.livingSituation as ELivingSituation)
    ) {
      payload.livingSituation = args.livingSituation;
      summary = `Salvar situação de moradia: ${payload.livingSituation}`;
    }

    if (!Object.keys(payload).length) {
      return JSON.stringify({
        error: `Informe ${expectedField} para a etapa atual`,
        verificationStatus,
        expectedField,
      });
    }

    try {
      assertFieldAllowedForStatus(verificationStatus, expectedField as OnboardingField);
    } catch (error) {
      return JSON.stringify(error);
    }

    const action: IProposedAction = {
      id: randomUUID(),
      type: EAgentActionType.UPDATE_PROFILE,
      summary,
      payload,
    };
    proposedActions.push(action);

    return JSON.stringify({
      status: 'proposed',
      actionId: action.id,
      message: 'Atualização de perfil proposta. Aguardando confirmação do usuário.',
    });
  }

  private toolProposeCompleteOnboarding(
    verificationStatus: EUserVerificationStatus,
    proposedActions: IProposedAction[],
  ): string {
    try {
      assertStatusAllowsCompletion(verificationStatus);
    } catch (error) {
      return JSON.stringify(error);
    }

    const action: IProposedAction = {
      id: randomUUID(),
      type: EAgentActionType.COMPLETE_ONBOARDING,
      summary: 'Finalizar onboarding e liberar o assistente financeiro',
      payload: {},
    };
    proposedActions.push(action);

    return JSON.stringify({
      status: 'proposed',
      actionId: action.id,
      message: 'Finalização do onboarding proposta. Aguardando confirmação do usuário.',
    });
  }
}
