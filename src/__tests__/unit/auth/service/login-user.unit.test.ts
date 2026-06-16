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

describe('When logging in with invalid password in AuthService', () => {
  it('Should reject with AUTH_INVALID_CREDENTIALS', async () => {
    const authService = new AuthService({
      userRepositoryRead: createUserRepositoryReadMock({
        findUserByEmail: jest.fn().mockResolvedValue({
          id: 'user-id',
          email: 'test@email.com',
          passwordHash: 'stored-hash',
        }),
      }),
      userRepositoryWrite: createUserRepositoryWriteMock(),
      refreshTokenRepositoryRead: createRefreshTokenRepositoryReadMock(),
      refreshTokenRepositoryWrite: createRefreshTokenRepositoryWriteMock(),
      passwordHasher: createPasswordHasherMock({
        compare: jest.fn().mockResolvedValue(false),
      }),
      authTokenProvider: createAuthTokenProviderMock(),
    });

    await expect(
      authService.loginUser({ email: 'test@email.com', password: 'WrongPass1' }),
    ).rejects.toMatchObject({
      status: 401,
      errorCode: EErrorCode.AUTH_INVALID_CREDENTIALS,
    });
  });
});

describe('When logging in with valid credentials in AuthService', () => {
  it('Should return auth tokens and persist refresh token', async () => {
    const expiresAt = new Date(Date.now() + 3_600_000);
    const refreshTokenRepositoryWrite = createRefreshTokenRepositoryWriteMock({
      createRefreshToken: jest.fn().mockResolvedValue({
        id: 'stored-token-id',
      }),
    });

    const authService = new AuthService({
      userRepositoryRead: createUserRepositoryReadMock({
        findUserByEmail: jest.fn().mockResolvedValue({
          id: 'user-id',
          email: 'test@email.com',
          passwordHash: 'stored-hash',
        }),
      }),
      userRepositoryWrite: createUserRepositoryWriteMock(),
      refreshTokenRepositoryRead: createRefreshTokenRepositoryReadMock(),
      refreshTokenRepositoryWrite,
      passwordHasher: createPasswordHasherMock({
        compare: jest.fn().mockResolvedValue(true),
      }),
      authTokenProvider: createAuthTokenProviderMock({
        generateAccessToken: jest
          .fn()
          .mockReturnValue({ token: 'access-token', expiresIn: 900 }),
        generateRefreshTokenValue: jest.fn().mockReturnValue('refresh-token'),
        getRefreshTokenExpiresAt: jest.fn().mockReturnValue(expiresAt),
      }),
    });

    const tokens = await authService.loginUser({
      email: 'test@email.com',
      password: 'StrongPassword123',
    });

    expect(tokens).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
    });
    expect(refreshTokenRepositoryWrite.createRefreshToken).toHaveBeenCalledTimes(1);
  });
});
