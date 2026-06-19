import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { EUserVerificationStatus } from '../entity/enums/EUserVerificationStatus';
import { IAddress } from '../entity/interfaces/address.interface';
import {
  IUserProfile,
  OnboardingField,
} from '../entity/interfaces/user-profile.interface';

const STATUS_TRANSITIONS: Record<
  EUserVerificationStatus,
  { expectedField?: OnboardingField; nextStatus: EUserVerificationStatus }
> = {
  [EUserVerificationStatus.PENDING_ADDRESS]: {
    expectedField: 'address',
    nextStatus: EUserVerificationStatus.PENDING_OCCUPATION,
  },
  [EUserVerificationStatus.PENDING_OCCUPATION]: {
    expectedField: 'occupationArea',
    nextStatus: EUserVerificationStatus.PENDING_INVESTMENT_PROFILE,
  },
  [EUserVerificationStatus.PENDING_INVESTMENT_PROFILE]: {
    expectedField: 'investmentProfile',
    nextStatus: EUserVerificationStatus.PENDING_LIVING_SITUATION,
  },
  [EUserVerificationStatus.PENDING_LIVING_SITUATION]: {
    expectedField: 'livingSituation',
    nextStatus: EUserVerificationStatus.READY_TO_COMPLETE,
  },
  [EUserVerificationStatus.READY_TO_COMPLETE]: {
    nextStatus: EUserVerificationStatus.COMPLETED,
  },
  [EUserVerificationStatus.COMPLETED]: {
    nextStatus: EUserVerificationStatus.COMPLETED,
  },
};

const ONBOARDING_FIELD_ORDER: OnboardingField[] = [
  'address',
  'occupationArea',
  'investmentProfile',
  'livingSituation',
];

export function isAddressComplete(address?: IAddress): boolean {
  return !!address?.zipCode?.trim() && !!address?.number?.trim();
}

export function getExpectedField(
  status: EUserVerificationStatus,
): OnboardingField | undefined {
  return STATUS_TRANSITIONS[status]?.expectedField;
}

export function getNextStatus(
  status: EUserVerificationStatus,
): EUserVerificationStatus {
  return STATUS_TRANSITIONS[status].nextStatus;
}

export function resolveVerificationStatus(
  profile?: IUserProfile,
): EUserVerificationStatus {
  if (profile?.verificationStatus) {
    return profile.verificationStatus;
  }

  if (profile?.onboardingCompletedAt) {
    return EUserVerificationStatus.COMPLETED;
  }

  if (!isAddressComplete(profile?.address)) {
    return EUserVerificationStatus.PENDING_ADDRESS;
  }
  if (!profile?.occupationArea?.trim()) {
    return EUserVerificationStatus.PENDING_OCCUPATION;
  }
  if (!profile?.investmentProfile) {
    return EUserVerificationStatus.PENDING_INVESTMENT_PROFILE;
  }
  if (!profile?.livingSituation) {
    return EUserVerificationStatus.PENDING_LIVING_SITUATION;
  }

  return EUserVerificationStatus.READY_TO_COMPLETE;
}

export function getMissingFieldsFromStatus(
  status: EUserVerificationStatus,
): OnboardingField[] {
  const expectedField = getExpectedField(status);
  if (!expectedField) {
    return [];
  }

  const fieldIndex = ONBOARDING_FIELD_ORDER.indexOf(expectedField);
  if (fieldIndex === -1) {
    return [];
  }

  return ONBOARDING_FIELD_ORDER.slice(fieldIndex);
}

export function assertFieldAllowedForStatus(
  status: EUserVerificationStatus,
  field: OnboardingField,
): void {
  const expectedField = getExpectedField(status);
  if (!expectedField || expectedField !== field) {
    throw {
      status: 400,
      errorCode: EErrorCode.ONBOARDING_INVALID_STATE,
      message: `Field "${field}" is not allowed in verification status "${status}"`,
      details: {
        verificationStatus: status,
        expectedField: expectedField ?? null,
        attemptedField: field,
      },
    } as IThrowedError;
  }
}

export function assertStatusAllowsCompletion(
  status: EUserVerificationStatus,
): void {
  if (status !== EUserVerificationStatus.READY_TO_COMPLETE) {
    throw {
      status: 400,
      errorCode: EErrorCode.ONBOARDING_INVALID_STATE,
      message: 'Onboarding can only be completed when status is READY_TO_COMPLETE',
      details: { verificationStatus: status },
    } as IThrowedError;
  }
}

export function buildStepContext(status: EUserVerificationStatus): string {
  const expectedField = getExpectedField(status);

  if (status === EUserVerificationStatus.READY_TO_COMPLETE) {
    return [
      '## Etapa atual (definida pelo servidor)',
      `Status: ${status}`,
      'Todos os campos obrigatórios foram preenchidos.',
      'Chame `propose_complete_onboarding` para propor a finalização.',
    ].join('\n');
  }

  if (status === EUserVerificationStatus.COMPLETED) {
    return [
      '## Etapa atual (definida pelo servidor)',
      `Status: ${status}`,
      'O onboarding já foi concluído.',
    ].join('\n');
  }

  const fieldInstructions: Record<OnboardingField, string> = {
    address:
      'O endereço é coletado fora deste chat. Não peça endereço aqui.',
    occupationArea:
      'Colete a área de atuação ou profissão (1-120 caracteres) e chame `propose_update_profile` com occupationArea.',
    investmentProfile:
      'Colete o perfil de investimento (CONSERVATIVE, MODERATE ou AGGRESSIVE) e chame `propose_update_profile` com investmentProfile.',
    livingSituation:
      'Colete a situação de moradia (ALONE, WITH_PARENTS, WITH_PARTNER, WITH_ROOMMATES ou OTHER) e chame `propose_update_profile` com livingSituation.',
  };

  return [
    '## Etapa atual (definida pelo servidor)',
    `Status: ${status}`,
    `Campo esperado: ${expectedField}`,
    fieldInstructions[expectedField!],
    'Colete apenas este campo. Não avance para outros campos.',
  ].join('\n');
}

export function validateProfileForVerificationStatus(
  profile: IUserProfile,
): void {
  const status =
    profile.verificationStatus ?? resolveVerificationStatus(profile);

  if (status === EUserVerificationStatus.COMPLETED) {
    if (!profile.onboardingCompletedAt) {
      throw new Error('Completed verification status requires onboardingCompletedAt');
    }
    return;
  }

  const expectedField = getExpectedField(status);

  if (!expectedField) {
    const allFieldsComplete = ONBOARDING_FIELD_ORDER.every((field) =>
      isFieldComplete(profile, field),
    );
    if (!allFieldsComplete) {
      throw new Error(
        `Profile is missing required fields for status ${status}`,
      );
    }
    return;
  }

  const fieldIndex = ONBOARDING_FIELD_ORDER.indexOf(expectedField);
  const prerequisiteFields = ONBOARDING_FIELD_ORDER.slice(0, fieldIndex);

  const incompletePrerequisites = prerequisiteFields.filter(
    (field) => !isFieldComplete(profile, field),
  );

  if (incompletePrerequisites.length > 0) {
    throw new Error(
      `Profile is missing prerequisite fields for status ${status}: ${incompletePrerequisites.join(', ')}`,
    );
  }
}

function isFieldComplete(profile: IUserProfile, field: OnboardingField): boolean {
  switch (field) {
    case 'address':
      return isAddressComplete(profile.address);
    case 'occupationArea':
      return !!profile.occupationArea?.trim();
    case 'investmentProfile':
      return !!profile.investmentProfile;
    case 'livingSituation':
      return !!profile.livingSituation;
    default:
      return false;
  }
}
