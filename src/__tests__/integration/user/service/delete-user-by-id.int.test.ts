import { UserServiceFactory } from '../../../../configuration/factory/user.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

const userService = UserServiceFactory.create();

describe('When we try to delete a user by id', () => {
  it('should return the deleted user when it exists', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const result = await userService.deleteUserById(userData.id);

    expect(result?.id).toBe(userData.id);
  });

  it('should remove the user from the database', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    await userService.deleteUserById(userData.id);
    const found = await UserModel.findOne({ id: userData.id });

    expect(found).toBeNull();
  });

  it('should reject with RESOURCE_NOT_FOUND when the user does not exist', async () => {
    await expect(
      userService.deleteUserById('nonexistent-id'),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { id: 'nonexistent-id' },
    });
    expect(ErrorCatalog[EErrorCode.RESOURCE_NOT_FOUND]).toBeDefined();
  });
});
