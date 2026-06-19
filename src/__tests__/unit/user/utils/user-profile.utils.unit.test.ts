import { EInvestmentProfile } from '../../../../domain/user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../../../domain/user/entity/enums/ELivingSituation';
import { EUserVerificationStatus } from '../../../../domain/user/entity/enums/EUserVerificationStatus';
import { IUserProfile } from '../../../../domain/user/entity/interfaces/user-profile.interface';
import {
  getOnboardingMissingFields,
  isOnboardingComplete,
  isOnboardingRequired,
  isProfileDataComplete,
} from '../../../../domain/user/utils/user-profile.utils';

const completeProfile: IUserProfile = {
  occupationArea: 'Tecnologia',
  investmentProfile: EInvestmentProfile.MODERATE,
  livingSituation: ELivingSituation.WITH_PARENTS,
  address: {
    zipCode: '01310100',
    street: 'Av Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    number: '100',
  },
  onboardingCompletedAt: new Date(),
  verificationStatus: EUserVerificationStatus.COMPLETED,
};

describe('When evaluating onboarding profile completeness', () => {
  it('Should list all missing fields for an empty profile', () => {
    expect(getOnboardingMissingFields()).toEqual([
      'address',
      'occupationArea',
      'investmentProfile',
      'livingSituation',
    ]);
  });

  it('Should mark profile data complete when required fields are filled', () => {
    const { onboardingCompletedAt: _completedAt, verificationStatus: _status, ...profileWithoutCompletion } =
      completeProfile;

    expect(isProfileDataComplete(profileWithoutCompletion)).toBe(true);
    expect(isOnboardingComplete(completeProfile)).toBe(true);
    expect(isOnboardingRequired(completeProfile)).toBe(false);
  });

  it('Should require onboarding completion timestamp', () => {
    const { onboardingCompletedAt: _completedAt, verificationStatus: _status, ...profileWithoutCompletion } =
      completeProfile;

    expect(isOnboardingComplete(profileWithoutCompletion)).toBe(false);
    expect(isOnboardingRequired(profileWithoutCompletion)).toBe(true);
  });
});
