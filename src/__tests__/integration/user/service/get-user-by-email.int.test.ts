import { UserServiceFactory } from '../../../../configuration/factory/user.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

const userService = UserServiceFactory.create();

describe('When we try to get a user by email', () => {
  it('should return the user when the email exists', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const result = await userService.getUserByEmail(userData.email);

    expect(result).toMatchObject({
      email: userData.email,
      name: userData.name,
    });
  });

  it('should reject with RESOURCE_NOT_FOUND when the email does not exist', async () => {
    await expect(
      userService.getUserByEmail('nonexistent@example.com'),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { email: 'nonexistent@example.com' },
    });
    expect(ErrorCatalog[EErrorCode.RESOURCE_NOT_FOUND]).toBeDefined();
  });
});
