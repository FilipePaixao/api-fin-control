import { UserServiceFactory } from '../../../../configuration/factory/user.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

const userService = UserServiceFactory.create();

describe('When we try to get a user by id', () => {
  it('should return the user when it exists', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const result = await userService.getUserById(userData.id);

    expect(result).toMatchObject({
      id: userData.id,
      name: userData.name,
      email: userData.email,
    });
  });

  it('should reject with RESOURCE_NOT_FOUND when the user does not exist', async () => {
    await expect(userService.getUserById('nonexistent-id')).rejects.toMatchObject(
      {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        details: { id: 'nonexistent-id' },
      },
    );
    expect(ErrorCatalog[EErrorCode.RESOURCE_NOT_FOUND]).toBeDefined();
  });
});
