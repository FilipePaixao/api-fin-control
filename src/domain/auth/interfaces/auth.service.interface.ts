import { IUserRepositoryRead } from '../../user/repository/user.repository.read';
import { IUserRepositoryWrite } from '../../user/repository/user.repository.write';
import { IUserPublicProfile } from '../../user/entity/interfaces/user.interface';
import { IRefreshTokenRepositoryRead } from '../repository/refresh-token.repository.read';
import { IRefreshTokenRepositoryWrite } from '../repository/refresh-token.repository.write';
import { IPasswordHasher } from './password-hasher.interface';
import { IAuthTokenProvider } from './auth-token-provider.interface';
import { IDocument } from '../../user/entity/interfaces/document.interface';

export interface IRegisterUserParams {
  name: string;
  email: string;
  password: string;
  document?: IDocument;
  age?: number;
}

export interface ILoginUserParams {
  email: string;
  password: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IRegisterUserResult extends IAuthTokens {
  user: IUserPublicProfile;
  onboardingRequired: boolean;
}

export interface IRefreshSessionParams {
  refreshToken: string;
}

export interface ILogoutParams {
  refreshToken: string;
}

export interface IParamsAuthService {
  userRepositoryRead: IUserRepositoryRead;
  userRepositoryWrite: IUserRepositoryWrite;
  refreshTokenRepositoryRead: IRefreshTokenRepositoryRead;
  refreshTokenRepositoryWrite: IRefreshTokenRepositoryWrite;
  passwordHasher: IPasswordHasher;
  authTokenProvider: IAuthTokenProvider;
}

export interface IAuthService {
  registerUser(params: IRegisterUserParams): Promise<IRegisterUserResult>;
  loginUser(params: ILoginUserParams): Promise<IAuthTokens>;
  refreshSession(params: IRefreshSessionParams): Promise<IAuthTokens>;
  logout(params: ILogoutParams): Promise<void>;
}
