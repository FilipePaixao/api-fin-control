import { UserServiceEntity } from '../entity/user.entity';
import { IUser } from '../entity/interfaces/user.interface';
import { IUserRepositoryRead } from '../repository/user.repository.read';
import { IUserRepositoryWrite } from '../repository/user.repository.write';
import {
  IParamsCreateUser,
  IParamsUpdateUser,
  IParamsUserService,
  IUserService,
} from '../interfaces/user.service.interface';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';

export class UserService implements IUserService {
  private userRepositoryRead: IUserRepositoryRead;
  private userRepositoryWrite: IUserRepositoryWrite;

  constructor({ userRepositoryRead, userRepositoryWrite }: IParamsUserService) {
    this.userRepositoryRead = userRepositoryRead;
    this.userRepositoryWrite = userRepositoryWrite;
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

    const userEntity = new UserServiceEntity(params);
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
    return user;
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

    const updated = await this.userRepositoryWrite.updateUserById(
      id,
      params.userData,
    );
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
}
