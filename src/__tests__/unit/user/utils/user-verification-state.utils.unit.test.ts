import { EInvestmentProfile } from '../../../../domain/user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../../../domain/user/entity/enums/ELivingSituation';
import { EUserVerificationStatus } from '../../../../domain/user/entity/enums/EUserVerificationStatus';
import { IUserProfile } from '../../../../domain/user/entity/interfaces/user-profile.interface';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import {
  assertFieldAllowedForStatus,
  assertStatusAllowsCompletion,
  buildStepContext,
  getExpectedField,
  getMissingFieldsFromStatus,
  getNextStatus,
  resolveVerificationStatus,
} from '../../../../domain/user/utils/user-verification-state.utils';

const address = {
  zipCode: '01310100',
  street: 'Av Paulista',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  number: '100',
};

describe('When resolving user verification status', () => {
  it('Should start at PENDING_ADDRESS for empty profile', () => {
    expect(resolveVerificationStatus()).toBe(EUserVerificationStatus.PENDING_ADDRESS);
  });

  it('Should advance through statuses based on filled fields', () => {
    expect(resolveVerificationStatus({ address })).toBe(
      EUserVerificationStatus.PENDING_OCCUPATION,
    );
    expect(
      resolveVerificationStatus({
        address,
        occupationArea: 'Tecnologia',
      }),
    ).toBe(EUserVerificationStatus.PENDING_INVESTMENT_PROFILE);
    expect(
      resolveVerificationStatus({
        address,
        occupationArea: 'Tecnologia',
        investmentProfile: EInvestmentProfile.MODERATE,
      }),
    ).toBe(EUserVerificationStatus.PENDING_LIVING_SITUATION);
    expect(
      resolveVerificationStatus({
        address,
        occupationArea: 'Tecnologia',
        investmentProfile: EInvestmentProfile.MODERATE,
        livingSituation: ELivingSituation.ALONE,
      }),
    ).toBe(EUserVerificationStatus.READY_TO_COMPLETE);
  });

  it('Should return COMPLETED when onboardingCompletedAt is set', () => {
    const profile: IUserProfile = {
      onboardingCompletedAt: new Date(),
      verificationStatus: EUserVerificationStatus.COMPLETED,
    };

    expect(resolveVerificationStatus(profile)).toBe(EUserVerificationStatus.COMPLETED);
  });
});

describe('When transitioning verification status', () => {
  it('Should return the next status in order', () => {
    expect(getNextStatus(EUserVerificationStatus.PENDING_ADDRESS)).toBe(
      EUserVerificationStatus.PENDING_OCCUPATION,
    );
    expect(getNextStatus(EUserVerificationStatus.PENDING_LIVING_SITUATION)).toBe(
      EUserVerificationStatus.READY_TO_COMPLETE,
    );
    expect(getNextStatus(EUserVerificationStatus.READY_TO_COMPLETE)).toBe(
      EUserVerificationStatus.COMPLETED,
    );
  });

  it('Should map status to expected onboarding field', () => {
    expect(getExpectedField(EUserVerificationStatus.PENDING_OCCUPATION)).toBe(
      'occupationArea',
    );
    expect(getExpectedField(EUserVerificationStatus.READY_TO_COMPLETE)).toBeUndefined();
  });

  it('Should list missing fields from current status', () => {
    expect(getMissingFieldsFromStatus(EUserVerificationStatus.PENDING_OCCUPATION)).toEqual([
      'occupationArea',
      'investmentProfile',
      'livingSituation',
    ]);
  });
});

describe('When asserting field permissions by status', () => {
  it('Should allow the expected field for the current status', () => {
    expect(() =>
      assertFieldAllowedForStatus(
        EUserVerificationStatus.PENDING_OCCUPATION,
        'occupationArea',
      ),
    ).not.toThrow();
  });

  it('Should reject fields outside the current status', () => {
    try {
      assertFieldAllowedForStatus(
        EUserVerificationStatus.PENDING_OCCUPATION,
        'investmentProfile',
      );
      throw new Error('Expected assertFieldAllowedForStatus to throw');
    } catch (error) {
      expect(error).toMatchObject({
        status: 400,
        errorCode: EErrorCode.ONBOARDING_INVALID_STATE,
      });
    }
  });

  it('Should only allow completion from READY_TO_COMPLETE', () => {
    expect(() =>
      assertStatusAllowsCompletion(EUserVerificationStatus.READY_TO_COMPLETE),
    ).not.toThrow();

    try {
      assertStatusAllowsCompletion(EUserVerificationStatus.PENDING_OCCUPATION);
      throw new Error('Expected assertStatusAllowsCompletion to throw');
    } catch (error) {
      expect(error).toMatchObject({
        status: 400,
        errorCode: EErrorCode.ONBOARDING_INVALID_STATE,
      });
    }
  });
});

describe('When building step context for onboarding AI', () => {
  it('Should include the expected field for collection statuses', () => {
    const context = buildStepContext(EUserVerificationStatus.PENDING_INVESTMENT_PROFILE);

    expect(context).toContain('PENDING_INVESTMENT_PROFILE');
    expect(context).toContain('investmentProfile');
  });

  it('Should instruct to complete when status is READY_TO_COMPLETE', () => {
    const context = buildStepContext(EUserVerificationStatus.READY_TO_COMPLETE);

    expect(context).toContain('propose_complete_onboarding');
  });
});
