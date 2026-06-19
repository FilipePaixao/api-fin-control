import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { EDocumentType } from '../../../../domain/user/entity/enums/EDocumentType';
import { AuthService } from '../../../../domain/auth/service/auth.service';
import {
  createAuthTokenProviderMock,
  createPasswordHasherMock,
  createRefreshTokenRepositoryReadMock,
  createRefreshTokenRepositoryWriteMock,
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When registering user with duplicated email in AuthService', () => {
  it('Should reject with RESOURCE_CONFLICT', async () => {
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserByEmail: jest.fn().mockResolvedValue({ id: 'existing-user' }),
    });

    const authService = new AuthService({
      userRepositoryRead,
      userRepositoryWrite: createUserRepositoryWriteMock(),
      refreshTokenRepositoryRead: createRefreshTokenRepositoryReadMock(),
      refreshTokenRepositoryWrite: createRefreshTokenRepositoryWriteMock(),
      passwordHasher: createPasswordHasherMock(),
      authTokenProvider: createAuthTokenProviderMock(),
    });

    await expect(
      authService.registerUser({
        name: 'Test User',
        email: 'test@email.com',
        password: 'StrongPassword123',
        document: { type: EDocumentType.CPF, value: '12345678901' },
      }),
    ).rejects.toMatchObject({
      status: 409,
      errorCode: EErrorCode.RESOURCE_CONFLICT,
    });
  });
});

describe('When registering user with a valid payload in AuthService', () => {
  it('Should hash password and return public profile', async () => {
    const createdAt = new Date();
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserByEmail: jest.fn().mockResolvedValue(null),
      findUserByDocument: jest.fn().mockResolvedValue(null),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock({
      createUser: jest.fn().mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        email: 'test@email.com',
        passwordHash: 'hashed-password',
        createdAt,
      }),
    });
    const passwordHasher = createPasswordHasherMock({
      hash: jest.fn().mockResolvedValue('hashed-password'),
    });
    const expiresAt = new Date(Date.now() + 3_600_000);

    const refreshTokenRepositoryWrite = createRefreshTokenRepositoryWriteMock({
      createRefreshToken: jest.fn().mockResolvedValue(undefined),
    });

    const authService = new AuthService({
      userRepositoryRead,
      userRepositoryWrite,
      refreshTokenRepositoryRead: createRefreshTokenRepositoryReadMock(),
      refreshTokenRepositoryWrite,
      passwordHasher,
      authTokenProvider: createAuthTokenProviderMock({
        generateAccessToken: jest
          .fn()
          .mockReturnValue({ token: 'access-token', expiresIn: 3600 }),
        generateRefreshTokenValue: jest.fn().mockReturnValue('refresh-token-value'),
        getRefreshTokenExpiresAt: jest.fn().mockReturnValue(expiresAt),
      }),
    });

    const registeredUser = await authService.registerUser({
      name: 'Test User',
      email: 'test@email.com',
      password: 'StrongPassword123',
      document: { type: EDocumentType.CPF, value: '12345678901' },
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('StrongPassword123');
    expect(refreshTokenRepositoryWrite.createRefreshToken).toHaveBeenCalled();
    expect(registeredUser).toMatchObject({
      user: {
        id: 'user-id',
        name: 'Test User',
        email: 'test@email.com',
        createdAt,
        onboardingRequired: true,
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token-value',
      expiresIn: 3600,
      onboardingRequired: true,
    });
    expect((registeredUser.user as { passwordHash?: string }).passwordHash).toBeUndefined();
  });
});
