import { createHash } from 'crypto';
import { AuthServiceFactory } from '../../../../configuration/factory/auth.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { RefreshTokenModel } from '../../../../infraestructure/db/mongo/models/refresh-token.model';
import { registerAndLoginUser } from '../../helpers/auth.helper';

const authService = AuthServiceFactory.create();

describe('When refreshing session with a valid token in AuthService', () => {
  it('Should rotate refresh token and revoke previous one', async () => {
    const loginTokens = await registerAndLoginUser();

    const refreshedTokens = await authService.refreshSession({
      refreshToken: loginTokens.refreshToken,
    });

    const oldTokenHash = createHash('sha256')
      .update(loginTokens.refreshToken)
      .digest('hex');
    const revokedOldToken = await RefreshTokenModel.findOne({ tokenHash: oldTokenHash });

    expect(refreshedTokens.refreshToken).toBeDefined();
    expect(refreshedTokens.refreshToken).not.toBe(loginTokens.refreshToken);
    expect(revokedOldToken?.revokedAt).toBeDefined();
  });
});

describe('When refreshing session with an invalid token in AuthService', () => {
  it('Should reject with AUTH_UNAUTHORIZED', async () => {
    await expect(
      authService.refreshSession({ refreshToken: 'invalid-token' }),
    ).rejects.toMatchObject({
      status: 401,
      errorCode: EErrorCode.AUTH_UNAUTHORIZED,
    });
  });
});
