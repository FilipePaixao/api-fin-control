import { createHash } from 'crypto';
import { AuthServiceFactory } from '../../../../configuration/factory/auth.service.factory';
import { RefreshTokenModel } from '../../../../infraestructure/db/mongo/models/refresh-token.model';
import { registerAndLoginUser } from '../../helpers/auth.helper';

const authService = AuthServiceFactory.create();

describe('When logging out with a valid refresh token in AuthService', () => {
  it('Should revoke the persisted refresh token', async () => {
    const loginTokens = await registerAndLoginUser();

    await authService.logout({ refreshToken: loginTokens.refreshToken });

    const tokenHash = createHash('sha256')
      .update(loginTokens.refreshToken)
      .digest('hex');
    const revokedToken = await RefreshTokenModel.findOne({ tokenHash });

    expect(revokedToken?.revokedAt).toBeDefined();
  });
});

describe('When logging out with an invalid refresh token in AuthService', () => {
  it('Should resolve without throwing', async () => {
    await expect(
      authService.logout({ refreshToken: 'invalid-token' }),
    ).resolves.toBeUndefined();
  });
});
