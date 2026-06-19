import { ILlmToolDefinition } from '../../agent/interfaces/llm-provider.interface';
import { EUserVerificationStatus } from '../../user/entity/enums/EUserVerificationStatus';
import { OnboardingField } from '../../user/entity/interfaces/user-profile.interface';
import { getExpectedField } from '../../user/utils/user-verification-state.utils';

const FIELD_TOOL_PROPERTIES: Record<
  Exclude<OnboardingField, 'address'>,
  Record<string, unknown>
> = {
  occupationArea: {
    type: 'string',
    description: 'Área de atuação ou profissão (1-120 caracteres)',
  },
  investmentProfile: {
    type: 'string',
    enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'],
  },
  livingSituation: {
    type: 'string',
    enum: ['ALONE', 'WITH_PARENTS', 'WITH_PARTNER', 'WITH_ROOMMATES', 'OTHER'],
  },
};

const PROPOSE_UPDATE_PROFILE_BASE: ILlmToolDefinition = {
  name: 'propose_update_profile',
  description:
    'Propõe atualização do campo da etapa atual. NÃO persiste — aguarda confirmação do usuário na interface. ' +
    'Use no mesmo turno em que o usuário responder — não peça confirmação no chat antes de chamar esta ferramenta.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

const PROPOSE_COMPLETE_ONBOARDING_TOOL: ILlmToolDefinition = {
  name: 'propose_complete_onboarding',
  description:
    'Propõe finalizar o onboarding. NÃO persiste — aguarda confirmação na interface. ' +
    'Chame imediatamente quando o servidor indicar status READY_TO_COMPLETE — não pergunte "posso confirmar?" no chat.',
  parameters: {
    type: 'object',
    properties: {},
  },
};

export function getOnboardingToolsForStatus(
  status: EUserVerificationStatus,
): ILlmToolDefinition[] {
  const expectedField = getExpectedField(status);

  if (status === EUserVerificationStatus.READY_TO_COMPLETE) {
    return [PROPOSE_COMPLETE_ONBOARDING_TOOL];
  }

  if (
    !expectedField ||
    expectedField === 'address' ||
    status === EUserVerificationStatus.COMPLETED
  ) {
    return [];
  }

  return [
    {
      ...PROPOSE_UPDATE_PROFILE_BASE,
      parameters: {
        type: 'object',
        properties: {
          [expectedField]: FIELD_TOOL_PROPERTIES[expectedField],
        },
        required: [expectedField],
      },
    },
  ];
}
