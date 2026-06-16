import { createHash } from 'crypto';
import { AuthService } from '../../../../domain/auth/service/auth.service';
import {
  createAuthTokenProviderMock,
  createPasswordHasherMock,
  createRefreshTokenRepositoryReadMock,
  createRefreshTokenRepositoryWriteMock,
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When logging out with invalid refresh token in AuthService', () => {
  it('Should resolve without revoking any token', async () => {
    const refreshTokenRepositoryWrite = createRefreshTokenRepositoryWriteMock();
    const authService = new AuthService({
      userRepositoryRead: createUserRepositoryReadMock(),
      userRepositoryWrite: createUserRepositoryWriteMock(),
      refreshTokenRepositoryRead: createRefreshTokenRepositoryReadMock({
        findByTokenHash: jest.fn().mockResolvedValue(null),
      }),
      refreshTokenRepositoryWrite,
      passwordHasher: createPasswordHasherMock(),
      authTokenProvider: createAuthTokenProviderMock(),
    });

    await expect(
      authService.logout({ refreshToken: 'invalid-token' }),
    ).resolves.toBeUndefined();
    expect(refreshTokenRepositoryWrite.revokeById).not.toHaveBeenCalled();
  });
});

describe('When logging out with valid refresh token in AuthService', () => {
  it('Should revoke persisted refresh token', async () => {
    const refreshTokenValue = 'valid-refresh-token';
    const refreshTokenRepositoryWrite = createRefreshTokenRepositoryWriteMock({
      revokeById: jest.fn().mockResolvedValue(undefined),
    });
    const authService = new AuthService({
      userRepositoryRead: createUserRepositoryReadMock(),
      userRepositoryWrite: createUserRepositoryWriteMock(),
      refreshTokenRepositoryRead: createRefreshTokenRepositoryReadMock({
        findByTokenHash: jest.fn().mockResolvedValue({
          id: 'stored-token-id',
          userId: 'user-id',
          tokenHash: createHash('sha256').update(refreshTokenValue).digest('hex'),
          expiresAt: new Date(Date.now() + 600_000),
          createdAt: new Date(),
        }),
      }),
      refreshTokenRepositoryWrite,
      passwordHasher: createPasswordHasherMock(),
      authTokenProvider: createAuthTokenProviderMock(),
    });

    await authService.logout({ refreshToken: refreshTokenValue });

    expect(refreshTokenRepositoryWrite.revokeById).toHaveBeenCalledWith('stored-token-id');
  });
});
