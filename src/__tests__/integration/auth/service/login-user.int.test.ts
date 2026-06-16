import { createHash } from 'crypto';
import { AuthServiceFactory } from '../../../../configuration/factory/auth.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { RefreshTokenModel } from '../../../../infraestructure/db/mongo/models/refresh-token.model';
import { uniqueRegisterPayload } from '../../helpers/auth.helper';

const authService = AuthServiceFactory.create();

describe('When logging in with valid credentials in AuthService', () => {
  it('Should return auth tokens and persist refresh token hash', async () => {
    const payload = uniqueRegisterPayload();
    await authService.registerUser(payload);

    const tokens = await authService.loginUser({
      email: payload.email,
      password: payload.password,
    });

    const storedRefreshToken = await RefreshTokenModel.findOne({
      tokenHash: createHash('sha256').update(tokens.refreshToken).digest('hex'),
    });

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresIn).toBeGreaterThan(0);
    expect(storedRefreshToken).not.toBeNull();
  });
});

describe('When logging in with invalid password in AuthService', () => {
  it('Should reject with AUTH_INVALID_CREDENTIALS', async () => {
    const payload = uniqueRegisterPayload();
    await authService.registerUser(payload);

    await expect(
      authService.loginUser({
        email: payload.email,
        password: 'WrongPassword1',
      }),
    ).rejects.toMatchObject({
      status: 401,
      errorCode: EErrorCode.AUTH_INVALID_CREDENTIALS,
    });
  });
});
