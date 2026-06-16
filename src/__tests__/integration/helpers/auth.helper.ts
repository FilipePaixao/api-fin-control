import { IUser } from '../../../domain/user/entity/interfaces/user.interface';
import { validUserMock } from '../../__mocks__/user.mock';
import { UserModel } from '../../../infraestructure/db/mongo/models/user.model';
import { JwtTokenProvider } from '../../../infraestructure/security/jwt-token.provider';

export async function createAuthenticatedUser(
  override: Partial<IUser> = {},
): Promise<{ user: IUser; token: string }> {
  const user = validUserMock(override);
  await UserModel.create(user);

  const tokenProvider = new JwtTokenProvider();
  const token = tokenProvider.generateAccessToken(user.id).token;

  return { user, token };
}
