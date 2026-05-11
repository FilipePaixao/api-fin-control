import { UserServiceFactory } from '../../../../configuration/factory/user.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

const userService = UserServiceFactory.create();

describe('When we try to create a user', () => {
  it('should return the created user when the email does not exist', async () => {
    const user = validUserMock();

    const result = await userService.createUser(user);

    expect(result).toMatchObject({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    expect(result.createdAt).toBeDefined();
  });

  it('should reject with RESOURCE_CONFLICT when the email already exists', async () => {
    const user = validUserMock();
    await UserModel.create(user);

    await expect(userService.createUser(user)).rejects.toMatchObject({
      status: 409,
      errorCode: EErrorCode.RESOURCE_CONFLICT,
      details: { email: user.email },
    });
    expect(ErrorCatalog[EErrorCode.RESOURCE_CONFLICT]).toBeDefined();
  });
});
