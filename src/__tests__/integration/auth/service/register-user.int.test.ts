import { AuthServiceFactory } from '../../../../configuration/factory/auth.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { uniqueRegisterPayload } from '../../helpers/auth.helper';

const authService = AuthServiceFactory.create();

describe('When registering user with a valid payload in AuthService', () => {
  it('Should return user public profile without password hash', async () => {
    const payload = uniqueRegisterPayload();

    const registeredUser = await authService.registerUser(payload);

    expect(registeredUser).toMatchObject({
      user: {
        name: payload.name,
        email: payload.email,
        document: payload.document,
        onboardingRequired: true,
      },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresIn: expect.any(Number),
      onboardingRequired: true,
    });
    expect((registeredUser.user as { passwordHash?: string }).passwordHash).toBeUndefined();
  });
});

describe('When registering user with duplicated email in AuthService', () => {
  it('Should reject with RESOURCE_CONFLICT', async () => {
    const payload = uniqueRegisterPayload();
    await authService.registerUser(payload);

    await expect(
      authService.registerUser(uniqueRegisterPayload({ email: payload.email })),
    ).rejects.toMatchObject({
      status: 409,
      errorCode: EErrorCode.RESOURCE_CONFLICT,
    });
  });
});
