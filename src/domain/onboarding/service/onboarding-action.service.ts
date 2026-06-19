import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { EAgentActionType } from '../../agent/entity/enums/EAgentActionType';
import { EInvestmentProfile } from '../../user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../user/entity/enums/ELivingSituation';
import { OnboardingField } from '../../user/entity/interfaces/user-profile.interface';
import {
  IExecuteAgentActionResult,
} from '../../agent/interfaces/agent.service.interface';
import { IUserService } from '../../user/interfaces/user.service.interface';
import {
  assertFieldAllowedForStatus,
  assertStatusAllowsCompletion,
  resolveVerificationStatus,
} from '../../user/utils/user-verification-state.utils';

interface IParamsOnboardingActionService {
  userService: IUserService;
}

export class OnboardingActionService {
  private readonly userService: IUserService;

  constructor({ userService }: IParamsOnboardingActionService) {
    this.userService = userService;
  }

  async executeAction(
    userId: string,
    input: { type?: unknown; payload?: unknown },
  ): Promise<IExecuteAgentActionResult> {
    const payload = (input.payload ?? {}) as Record<string, unknown>;

    switch (input.type) {
      case EAgentActionType.UPDATE_PROFILE:
        return this.executeUpdateProfile(userId, payload);
      case EAgentActionType.COMPLETE_ONBOARDING:
        return this.executeCompleteOnboarding(userId);
      default:
        throw {
          status: 400,
          errorCode: EErrorCode.FIELD_INVALID,
          message: 'Invalid action type',
        } as IThrowedError;
    }
  }

  private async executeUpdateProfile(
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<IExecuteAgentActionResult> {
    const user = await this.userService.getUserById(userId);
    const verificationStatus = resolveVerificationStatus(user.profile);

    const updateInput: {
      occupationArea?: string;
      investmentProfile?: EInvestmentProfile;
      livingSituation?: ELivingSituation;
    } = {};

    const updatedFields: OnboardingField[] = [];

    if (typeof payload.occupationArea === 'string') {
      updateInput.occupationArea = payload.occupationArea;
      updatedFields.push('occupationArea');
    }
    if (
      typeof payload.investmentProfile === 'string' &&
      Object.values(EInvestmentProfile).includes(
        payload.investmentProfile as EInvestmentProfile,
      )
    ) {
      updateInput.investmentProfile = payload.investmentProfile as EInvestmentProfile;
      updatedFields.push('investmentProfile');
    }
    if (
      typeof payload.livingSituation === 'string' &&
      Object.values(ELivingSituation).includes(
        payload.livingSituation as ELivingSituation,
      )
    ) {
      updateInput.livingSituation = payload.livingSituation as ELivingSituation;
      updatedFields.push('livingSituation');
    }

    if (!updatedFields.length) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Invalid profile payload',
      } as IThrowedError;
    }

    if (updatedFields.length !== 1) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Only one onboarding field can be updated per request',
      } as IThrowedError;
    }

    assertFieldAllowedForStatus(verificationStatus, updatedFields[0]);

    const profile = await this.userService.updateProfile(userId, updateInput);
    return {
      success: true,
      message: 'Perfil atualizado com sucesso.',
      data: { profile },
    };
  }

  private async executeCompleteOnboarding(
    userId: string,
  ): Promise<IExecuteAgentActionResult> {
    const user = await this.userService.getUserById(userId);
    const verificationStatus = resolveVerificationStatus(user.profile);
    assertStatusAllowsCompletion(verificationStatus);

    const status = await this.userService.completeOnboarding(userId);
    return {
      success: true,
      message: 'Onboarding concluído com sucesso.',
      data: status as unknown as Record<string, unknown>,
    };
  }
}
