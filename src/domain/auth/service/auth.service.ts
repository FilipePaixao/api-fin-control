import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { IUserRepositoryRead } from '../../user/repository/user.repository.read';
import { IUserRepositoryWrite } from '../../user/repository/user.repository.write';
import {
  RegisterUserServiceEntity,
  toUserPublicProfile,
} from '../../user/entity/user.entity';
import { IRefreshToken } from '../entity/interfaces/refresh-token.interface';
import { IRefreshTokenRepositoryRead } from '../repository/refresh-token.repository.read';
import { IRefreshTokenRepositoryWrite } from '../repository/refresh-token.repository.write';
import { IPasswordHasher } from '../interfaces/password-hasher.interface';
import { IAuthTokenProvider } from '../interfaces/auth-token-provider.interface';
import {
  IAuthService,
  IAuthTokens,
  ILoginUserParams,
  ILogoutParams,
  IParamsAuthService,
  IRefreshSessionParams,
  IRegisterUserParams,
} from '../interfaces/auth.service.interface';

export class AuthService implements IAuthService {
  private readonly userRepositoryRead: IUserRepositoryRead;
  private readonly userRepositoryWrite: IUserRepositoryWrite;
  private readonly refreshTokenRepositoryRead: IRefreshTokenRepositoryRead;
  private readonly refreshTokenRepositoryWrite: IRefreshTokenRepositoryWrite;
  private readonly passwordHasher: IPasswordHasher;
  private readonly authTokenProvider: IAuthTokenProvider;

  constructor({
    userRepositoryRead,
    userRepositoryWrite,
    refreshTokenRepositoryRead,
    refreshTokenRepositoryWrite,
    passwordHasher,
    authTokenProvider,
  }: IParamsAuthService) {
    this.userRepositoryRead = userRepositoryRead;
    this.userRepositoryWrite = userRepositoryWrite;
    this.refreshTokenRepositoryRead = refreshTokenRepositoryRead;
    this.refreshTokenRepositoryWrite = refreshTokenRepositoryWrite;
    this.passwordHasher = passwordHasher;
    this.authTokenProvider = authTokenProvider;
  }

  async registerUser(params: IRegisterUserParams) {
    const existingUserByEmail = await this.userRepositoryRead.findUserByEmail(
      params.email,
    );
    if (existingUserByEmail) {
      throw {
        status: 409,
        errorCode: EErrorCode.RESOURCE_CONFLICT,
        message: 'A user with this email already exists',
        details: { email: params.email },
      } as IThrowedError;
    }

    if (params.document) {
      const existingUserByDocument =
        await this.userRepositoryRead.findUserByDocument(params.document.value);
      if (existingUserByDocument) {
        throw {
          status: 409,
          errorCode: EErrorCode.RESOURCE_CONFLICT,
          message: 'A user with this document already exists',
          details: { document: params.document.value },
        } as IThrowedError;
      }
    }

    const passwordHash = await this.passwordHasher.hash(params.password);
    const userEntity = new RegisterUserServiceEntity({
      ...params,
      passwordHash,
    });
    const createdUser = await this.userRepositoryWrite.createUser(userEntity);
    return toUserPublicProfile(createdUser);
  }

  async loginUser(params: ILoginUserParams): Promise<IAuthTokens> {
    const user = await this.userRepositoryRead.findUserByEmail(params.email);
    if (!user?.passwordHash) {
      throw this.invalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      params.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw this.invalidCredentialsError();
    }

    return this.issueAuthTokens(user.id);
  }

  async refreshSession(params: IRefreshSessionParams): Promise<IAuthTokens> {
    const storedRefreshToken = await this.findActiveRefreshToken(
      params.refreshToken,
    );
    await this.refreshTokenRepositoryWrite.revokeById(storedRefreshToken.id);
    return this.issueAuthTokens(storedRefreshToken.userId);
  }

  async logout(params: ILogoutParams): Promise<void> {
    const tokenHash = await this.passwordHasher.hash(params.refreshToken);
    const storedRefreshToken =
      await this.refreshTokenRepositoryRead.findByTokenHash(tokenHash);

    if (!storedRefreshToken || storedRefreshToken.revokedAt) {
      return;
    }

    await this.refreshTokenRepositoryWrite.revokeById(storedRefreshToken.id);
  }

  private async issueAuthTokens(userId: string): Promise<IAuthTokens> {
    const { token: accessToken, expiresIn } =
      this.authTokenProvider.generateAccessToken(userId);
    const refreshTokenValue = this.authTokenProvider.generateRefreshTokenValue();
    const tokenHash = await this.passwordHasher.hash(refreshTokenValue);

    const refreshTokenEntity: IRefreshToken = {
      id: new Types.ObjectId().toHexString(),
      userId,
      tokenHash,
      expiresAt: this.authTokenProvider.getRefreshTokenExpiresAt(),
      createdAt: new Date(),
    };

    await this.refreshTokenRepositoryWrite.createRefreshToken(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn,
    };
  }

  private async findActiveRefreshToken(refreshToken: string): Promise<IRefreshToken> {
    const tokenHash = await this.passwordHasher.hash(refreshToken);
    const storedRefreshToken =
      await this.refreshTokenRepositoryRead.findByTokenHash(tokenHash);

    if (!storedRefreshToken) {
      throw {
        status: 401,
        errorCode: EErrorCode.AUTH_UNAUTHORIZED,
        message: 'Invalid refresh token',
      } as IThrowedError;
    }

    if (storedRefreshToken.revokedAt) {
      throw {
        status: 401,
        errorCode: EErrorCode.AUTH_TOKEN_REVOKED,
        message: 'Refresh token has been revoked',
      } as IThrowedError;
    }

    if (storedRefreshToken.expiresAt.getTime() <= Date.now()) {
      throw {
        status: 401,
        errorCode: EErrorCode.AUTH_TOKEN_EXPIRED,
        message: 'Refresh token has expired',
      } as IThrowedError;
    }

    return storedRefreshToken;
  }

  private invalidCredentialsError(): IThrowedError {
    return {
      status: 401,
      errorCode: EErrorCode.AUTH_INVALID_CREDENTIALS,
      message: 'Invalid email or password',
    } as IThrowedError;
  }
}
