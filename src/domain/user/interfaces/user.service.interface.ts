import { IUserRepositoryRead } from '../repository/user.repository.read';
import { IUserRepositoryWrite } from '../repository/user.repository.write';
import { IConversationService } from '../../agent/interfaces/conversation.service.interface';
import { ECurrency } from '../entity/enums/ECurrency';
import { EInvestmentProfile } from '../entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../entity/enums/ELivingSituation';
import { IAddress } from '../entity/interfaces/address.interface';
import { ISalary } from '../entity/interfaces/salary.interface';
import { IOnboardingStatus } from '../entity/interfaces/user-profile.interface';
import { IUser } from '../entity/interfaces/user.interface';

export interface IParamsCreateUser {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
}

export interface IParamsUpdateUser {
  userData: Partial<IUser>;
}

export interface IUpdateSalaryInput {
  amount: number;
  currency: ECurrency;
  paymentDay?: number;
  source?: string;
}

export interface IUpdateProfileAddressInput {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  complement?: string;
}

export interface IUpdateProfileInput {
  occupationArea?: string;
  investmentProfile?: EInvestmentProfile;
  livingSituation?: ELivingSituation;
}

export interface IParamsUserService {
  userRepositoryRead: IUserRepositoryRead;
  userRepositoryWrite: IUserRepositoryWrite;
  conversationService?: IConversationService;
}

export interface IUserService {
  createUser(params: IParamsCreateUser): Promise<IUser>;
  getUserById(id: string): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser>;
  updateUserById(id: string, params: IParamsUpdateUser): Promise<IUser>;
  deleteUserById(id: string): Promise<IUser>;
  listUsers(filter: Partial<IUser>): Promise<IUser[]>;
  updateSalary(userId: string, params: IUpdateSalaryInput): Promise<ISalary>;
  getAuthenticatedProfile(userId: string): Promise<Omit<IUser, 'passwordHash'>>;
  updateProfileAddress(
    userId: string,
    params: IUpdateProfileAddressInput,
  ): Promise<IAddress>;
  updateProfile(userId: string, params: IUpdateProfileInput): Promise<IUser['profile']>;
  getOnboardingStatus(userId: string): Promise<IOnboardingStatus>;
  completeOnboarding(userId: string): Promise<IOnboardingStatus>;
}
