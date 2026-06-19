import { EInvestmentProfile } from '../enums/EInvestmentProfile';
import { ELivingSituation } from '../enums/ELivingSituation';
import { EUserVerificationStatus } from '../enums/EUserVerificationStatus';
import { IAddress } from './address.interface';

export interface IUserProfile {
  occupationArea?: string;
  investmentProfile?: EInvestmentProfile;
  livingSituation?: ELivingSituation;
  address?: IAddress;
  onboardingCompletedAt?: Date;
  verificationStatus?: EUserVerificationStatus;
}

export type OnboardingField =
  | 'address'
  | 'occupationArea'
  | 'investmentProfile'
  | 'livingSituation';

export interface IOnboardingStatus {
  completed: boolean;
  verificationStatus: EUserVerificationStatus;
  currentField?: OnboardingField;
  missingFields: OnboardingField[];
  onboardingConversationId?: string;
}
