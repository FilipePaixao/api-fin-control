import { UserServiceEntity, toUserPublicProfile } from '../entity/user.entity';
import { EUserVerificationStatus } from '../entity/enums/EUserVerificationStatus';
import { IConversationService } from '../../agent/interfaces/conversation.service.interface';
import { IAddress } from '../entity/interfaces/address.interface';
import { ISalary } from '../entity/interfaces/salary.interface';
import { IUser } from '../entity/interfaces/user.interface';
import { IUserProfile, OnboardingField } from '../entity/interfaces/user-profile.interface';
import { IUserRepositoryRead } from '../repository/user.repository.read';
import { IUserRepositoryWrite } from '../repository/user.repository.write';
import {
  IParamsCreateUser,
  IParamsUpdateUser,
  IParamsUserService,
  IUpdateProfileAddressInput,
  IUpdateProfileInput,
  IUpdateSalaryInput,
  IUserService,
} from '../interfaces/user.service.interface';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import {
  getCurrentOnboardingField,
  getOnboardingMissingFields,
  isOnboardingComplete,
} from '../utils/user-profile.utils';
import {
  assertFieldAllowedForStatus,
  assertStatusAllowsCompletion,
  getNextStatus,
  resolveVerificationStatus,
} from '../utils/user-verification-state.utils';

export class UserService implements IUserService {
  private userRepositoryRead: IUserRepositoryRead;
  private userRepositoryWrite: IUserRepositoryWrite;
  private conversationService?: IConversationService;

  constructor({ userRepositoryRead, userRepositoryWrite, conversationService }: IParamsUserService) {
    this.userRepositoryRead = userRepositoryRead;
    this.userRepositoryWrite = userRepositoryWrite;
    this.conversationService = conversationService;
  }

  /**
   * Create a new user
   * @param params - The user data to create
   * @returns The created user document
   */
  async createUser(params: IParamsCreateUser): Promise<IUser> {
    const existingUser = await this.userRepositoryRead.findUserByEmail(
      params.email,
    );
    if (existingUser) {
      throw {
        status: 409,
        errorCode: EErrorCode.RESOURCE_CONFLICT,
        message: 'A user with this email already exists',
        details: { email: params.email },
      } as IThrowedError;
    }

    const userEntity = new UserServiceEntity({
      ...params,
      createdAt: params.createdAt ?? new Date(),
      profile: {
        verificationStatus: EUserVerificationStatus.PENDING_ADDRESS,
      },
    });
    return await this.userRepositoryWrite.createUser(userEntity);
  }

  /**
   * Get a user by ID
   * @param id - The user's ID
   * @returns The user document or null if not found
   */
  async getUserById(id: string): Promise<IUser> {
    const user = await this.userRepositoryRead.findUserById(id);
    if (!user) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
        details: { id },
      } as IThrowedError;
    }
    return this.backfillVerificationStatusIfNeeded(id, user);
  }

  private async backfillVerificationStatusIfNeeded(
    id: string,
    user: IUser,
  ): Promise<IUser> {
    const resolvedStatus = resolveVerificationStatus(user.profile);
    if (user.profile?.verificationStatus === resolvedStatus) {
      return user;
    }

    const profile: IUserProfile = {
      ...(user.profile ?? {}),
      verificationStatus: resolvedStatus,
    };

    const updatedUser = await this.userRepositoryWrite.updateUserById(id, {
      profile,
    });

    return updatedUser ?? { ...user, profile };
  }

  /**
   * Get a user by email
   * @param email - The user's email
   * @returns The user document or null if not found
   */
  async getUserByEmail(email: string): Promise<IUser> {
    const user = await this.userRepositoryRead.findUserByEmail(email);
    if (!user) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
        details: { email },
      } as IThrowedError;
    }
    return user;
  }

  /**
   * Update a user's information by ID
   * @param id - The user's ID
   * @param updateData - The data to update
   * @returns The updated user document or null if not found
   */
  async updateUserById(
    id: string,
    params: IParamsUpdateUser,
  ): Promise<IUser> {
    const user = await this.userRepositoryRead.findUserById(id);
    if (!user) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
        details: { id },
      } as IThrowedError;
    }

    const userData = params.userData.profile
      ? {
          ...params.userData,
          profile: { ...(user.profile ?? {}), ...params.userData.profile },
        }
      : params.userData;

    const updated = await this.userRepositoryWrite.updateUserById(id, userData);
    if (!updated) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
        details: { id },
      } as IThrowedError;
    }
    return updated;
  }

  /**
   * Delete a user by ID
   * @param id - The user's ID
   * @returns The deleted user document or null if not found
   */
  async deleteUserById(id: string): Promise<IUser> {
    const user = await this.userRepositoryRead.findUserById(id);
    if (!user) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
        details: { id },
      } as IThrowedError;
    }

    await this.userRepositoryWrite.deleteUserById(id);
    return user;
  }

  /**
   * List all users with optional filters
   * @param filter - Filters for the query
   * @returns An array of user documents
   */
  async listUsers(filter: Partial<IUser> = {}): Promise<IUser[]> {
    return await this.userRepositoryRead.listUsers(filter);
  }

  async getAuthenticatedProfile(userId: string): Promise<Omit<IUser, 'passwordHash'>> {
    const user = await this.getUserById(userId);
    return toUserPublicProfile(user);
  }

  async updateSalary(userId: string, params: IUpdateSalaryInput): Promise<ISalary> {
    const user = await this.userRepositoryRead.findUserById(userId);
    if (!user) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
        details: { id: userId },
      } as IThrowedError;
    }

    const now = new Date();
    const salary: ISalary = {
      amount: params.amount,
      currency: params.currency,
      paymentDay: params.paymentDay,
      source: params.source,
      createdAt: user.salary?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      UserServiceEntity.validateSalary(salary);
    } catch (error) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid salary payload',
      } as IThrowedError;
    }

    const updatedUser = await this.userRepositoryWrite.updateUserById(userId, {
      salary,
    });
    if (!updatedUser?.salary) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
        details: { id: userId },
      } as IThrowedError;
    }

    return updatedUser.salary;
  }

  async updateProfileAddress(
    userId: string,
    params: IUpdateProfileAddressInput,
  ): Promise<IAddress> {
    const user = await this.getUserById(userId);
    const address = UserServiceEntity.normalizeAddress({
      zipCode: params.zipCode,
      street: params.street,
      neighborhood: params.neighborhood,
      city: params.city,
      state: params.state,
      number: params.number,
      complement: params.complement,
    });

    try {
      UserServiceEntity.validateAddress(address);
    } catch (error) {
      if (this.isThrowedError(error)) {
        throw error;
      }
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid address payload',
      } as IThrowedError;
    }

    const currentStatus = resolveVerificationStatus(user.profile);
    assertFieldAllowedForStatus(currentStatus, 'address');

    const profile: IUserProfile = {
      ...(user.profile ?? {}),
      address,
      verificationStatus: getNextStatus(currentStatus),
    };

    const updatedUser = await this.userRepositoryWrite.updateUserById(userId, {
      profile,
    });
    if (!updatedUser?.profile?.address) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
        details: { id: userId },
      } as IThrowedError;
    }

    return updatedUser.profile.address;
  }

  async updateProfile(
    userId: string,
    params: IUpdateProfileInput,
  ): Promise<IUser['profile']> {
    const user = await this.getUserById(userId);
    const currentStatus = resolveVerificationStatus(user.profile);
    const updatedFields = this.getUpdatedOnboardingFields(params);

    if (
      currentStatus !== EUserVerificationStatus.COMPLETED &&
      updatedFields.length !== 1
    ) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: 'Only one onboarding field can be updated per request',
      } as IThrowedError;
    }

    if (updatedFields.length === 1) {
      assertFieldAllowedForStatus(currentStatus, updatedFields[0]);
    }

    const profile: IUserProfile = {
      ...(user.profile ?? {}),
      ...(params.occupationArea !== undefined
        ? { occupationArea: params.occupationArea.trim() }
        : {}),
      ...(params.investmentProfile !== undefined
        ? { investmentProfile: params.investmentProfile }
        : {}),
      ...(params.livingSituation !== undefined
        ? { livingSituation: params.livingSituation }
        : {}),
      ...(updatedFields.length === 1
        ? { verificationStatus: getNextStatus(currentStatus) }
        : {}),
    };

    try {
      UserServiceEntity.validateProfile(profile);
    } catch (error) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid profile payload',
      } as IThrowedError;
    }

    const updatedUser = await this.userRepositoryWrite.updateUserById(userId, {
      profile,
    });
    return updatedUser?.profile;
  }

  async getOnboardingStatus(userId: string) {
    const onboardingConversation = this.conversationService
      ? await this.conversationService.getOrCreateOnboardingConversation(userId)
      : undefined;
    const user = await this.getUserById(userId);
    const verificationStatus = resolveVerificationStatus(user.profile);

    return {
      completed: isOnboardingComplete(user.profile),
      verificationStatus,
      currentField: getCurrentOnboardingField(user.profile),
      missingFields: getOnboardingMissingFields(user.profile),
      onboardingConversationId: onboardingConversation?.id,
    };
  }

  async completeOnboarding(userId: string) {
    const user = await this.getUserById(userId);
    const currentStatus = resolveVerificationStatus(user.profile);
    assertStatusAllowsCompletion(currentStatus);

    const profile: IUserProfile = {
      ...(user.profile ?? {}),
      verificationStatus: EUserVerificationStatus.COMPLETED,
      onboardingCompletedAt: new Date(),
    };

    await this.userRepositoryWrite.updateUserById(userId, { profile });
    return this.getOnboardingStatus(userId);
  }

  private getUpdatedOnboardingFields(params: IUpdateProfileInput): OnboardingField[] {
    const fields: OnboardingField[] = [];
    if (params.occupationArea !== undefined) {
      fields.push('occupationArea');
    }
    if (params.investmentProfile !== undefined) {
      fields.push('investmentProfile');
    }
    if (params.livingSituation !== undefined) {
      fields.push('livingSituation');
    }
    return fields;
  }

  private isThrowedError(error: unknown): error is IThrowedError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'errorCode' in error
    );
  }
}
