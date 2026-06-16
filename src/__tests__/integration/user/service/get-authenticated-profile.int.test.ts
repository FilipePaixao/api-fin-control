import { UserServiceFactory } from '../../../../configuration/factory/user.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

const userService = UserServiceFactory.create();

describe('When getting authenticated profile for an existing user', () => {
  it('Should return profile without password hash', async () => {
    const userData = validUserMock({ passwordHash: 'hashed-password' });
    await UserModel.create(userData);

    const profile = await userService.getAuthenticatedProfile(userData.id);

    expect(profile).toMatchObject({
      id: userData.id,
      name: userData.name,
      email: userData.email,
    });
    expect((profile as { passwordHash?: string }).passwordHash).toBeUndefined();
  });
});

describe('When getting authenticated profile for a missing user', () => {
  it('Should reject with RESOURCE_NOT_FOUND', async () => {
    await expect(
      userService.getAuthenticatedProfile('nonexistent-id'),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { id: 'nonexistent-id' },
    });
    expect(ErrorCatalog[EErrorCode.RESOURCE_NOT_FOUND]).toBeDefined();
  });
});
