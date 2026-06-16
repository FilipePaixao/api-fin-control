import { createHash } from 'crypto';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { AuthService } from '../../../../domain/auth/service/auth.service';
import {
  createAuthTokenProviderMock,
  createPasswordHasherMock,
  createRefreshTokenRepositoryReadMock,
  createRefreshTokenRepositoryWriteMock,
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When refreshing session with invalid token in AuthService', () => {
  it('Should reject with AUTH_UNAUTHORIZED', async () => {
    const authService = new AuthService({
      userRepositoryRead: createUserRepositoryReadMock(),
      userRepositoryWrite: createUserRepositoryWriteMock(),
      refreshTokenRepositoryRead: createRefreshTokenRepositoryReadMock({
        findByTokenHash: jest.fn().mockResolvedValue(null),
      }),
      refreshTokenRepositoryWrite: createRefreshTokenRepositoryWriteMock(),
      passwordHasher: createPasswordHasherMock(),
      authTokenProvider: createAuthTokenProviderMock(),
    });

    await expect(
      authService.refreshSession({ refreshToken: 'invalid-token' }),
    ).rejects.toMatchObject({
      status: 401,
      errorCode: EErrorCode.AUTH_UNAUTHORIZED,
    });
  });
});

describe('When refreshing session with valid token in AuthService', () => {
  it('Should revoke old refresh token and issue new tokens', async () => {
    const expiresAt = new Date(Date.now() + 3_600_000);
    const refreshTokenValue = 'valid-refresh-token';
    const refreshTokenRepositoryRead = createRefreshTokenRepositoryReadMock({
      findByTokenHash: jest.fn().mockResolvedValue({
        id: 'stored-token-id',
        userId: 'user-id',
        tokenHash: createHash('sha256').update(refreshTokenValue).digest('hex'),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      }),
    });
    const refreshTokenRepositoryWrite = createRefreshTokenRepositoryWriteMock({
      revokeById: jest.fn().mockResolvedValue(undefined),
      createRefreshToken: jest.fn().mockResolvedValue({ id: 'new-token-id' }),
    });

    const authService = new AuthService({
      userRepositoryRead: createUserRepositoryReadMock(),
      userRepositoryWrite: createUserRepositoryWriteMock(),
      refreshTokenRepositoryRead,
      refreshTokenRepositoryWrite,
      passwordHasher: createPasswordHasherMock(),
      authTokenProvider: createAuthTokenProviderMock({
        generateAccessToken: jest
          .fn()
          .mockReturnValue({ token: 'new-access-token', expiresIn: 900 }),
        generateRefreshTokenValue: jest.fn().mockReturnValue('new-refresh-token'),
        getRefreshTokenExpiresAt: jest.fn().mockReturnValue(expiresAt),
      }),
    });

    const tokens = await authService.refreshSession({
      refreshToken: refreshTokenValue,
    });

    expect(tokens).toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 900,
    });
    expect(refreshTokenRepositoryRead.findByTokenHash).toHaveBeenCalledWith(
      createHash('sha256').update(refreshTokenValue).digest('hex'),
    );
    expect(refreshTokenRepositoryWrite.revokeById).toHaveBeenCalledWith('stored-token-id');
    expect(refreshTokenRepositoryWrite.createRefreshToken).toHaveBeenCalledTimes(1);
  });
});
