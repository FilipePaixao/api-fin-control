import { IUser } from '../../../domain/user/entity/interfaces/user.interface';
import { EDocumentType } from '../../../domain/user/entity/enums/EDocumentType';
import {
  IAuthTokens,
  IRegisterUserParams,
} from '../../../domain/auth/interfaces/auth.service.interface';
import { AuthServiceFactory } from '../../../configuration/factory/auth.service.factory';
import { validUserMock } from '../../__mocks__/user.mock';
import { UserModel } from '../../../infraestructure/db/mongo/models/user.model';
import { JwtTokenProvider } from '../../../infraestructure/security/jwt-token.provider';

export function uniqueRegisterPayload(
  override: Partial<IRegisterUserParams> = {},
): IRegisterUserParams {
  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    name: 'Test User',
    email: `test.user.${uniqueSuffix}@email.com`,
    password: 'StrongPassword123',
    document: {
      type: EDocumentType.CPF,
      value: uniqueSuffix.replace(/\D/g, '').slice(-11).padStart(11, '0'),
    },
    ...override,
  };
}

export async function registerAndLoginUser(
  override: Partial<IRegisterUserParams> = {},
): Promise<IAuthTokens> {
  const authService = AuthServiceFactory.create();
  const payload = uniqueRegisterPayload(override);
  await authService.registerUser(payload);
  return authService.loginUser({
    email: payload.email,
    password: payload.password,
  });
}

export async function createAuthenticatedUser(
  override: Partial<IUser> = {},
): Promise<{ user: IUser; token: string }> {
  const user = validUserMock(override);
  await UserModel.create(user);

  const tokenProvider = new JwtTokenProvider();
  const token = tokenProvider.generateAccessToken(user.id).token;

  return { user, token };
}
