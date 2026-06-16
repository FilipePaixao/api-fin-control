import { UserServiceFactory } from '../../../../configuration/factory/user.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

const userService = UserServiceFactory.create();

describe('When we create a user with a valid payload', () => {
  it('Should return the created user', async () => {
    const user = validUserMock();

    const result = await userService.createUser(user);

    expect(result).toMatchObject({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    expect(result.createdAt).toBeDefined();
  });
});

describe('When we create a user with an email that already exists', () => {
  it('Should reject with RESOURCE_CONFLICT', async () => {
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
