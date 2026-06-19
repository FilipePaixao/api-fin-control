import {
  IUserProfile,
  OnboardingField,
} from '../entity/interfaces/user-profile.interface';
import { EUserVerificationStatus } from '../entity/enums/EUserVerificationStatus';
import {
  getExpectedField,
  getMissingFieldsFromStatus,
  resolveVerificationStatus,
} from './user-verification-state.utils';

export function getOnboardingMissingFields(profile?: IUserProfile): OnboardingField[] {
  const status = resolveVerificationStatus(profile);
  return getMissingFieldsFromStatus(status);
}

export function isProfileDataComplete(profile?: IUserProfile): boolean {
  return resolveVerificationStatus(profile) === EUserVerificationStatus.READY_TO_COMPLETE;
}

export function isOnboardingComplete(profile?: IUserProfile): boolean {
  return resolveVerificationStatus(profile) === EUserVerificationStatus.COMPLETED;
}

export function isOnboardingRequired(profile?: IUserProfile): boolean {
  return !isOnboardingComplete(profile);
}

export function getCurrentOnboardingField(
  profile?: IUserProfile,
): OnboardingField | undefined {
  const status = resolveVerificationStatus(profile);
  return getExpectedField(status);
}
