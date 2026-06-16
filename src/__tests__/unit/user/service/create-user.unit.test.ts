import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserService } from '../../../../domain/user/service/user.service';
import { validUserMock } from '../../../__mocks__/user.mock';
import {
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When creating a user with a valid payload', () => {
  it('Should return the created user', async () => {
    const userData = validUserMock();
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserByEmail: jest.fn().mockResolvedValue(null),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock({
      createUser: jest.fn().mockResolvedValue(userData),
    });
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    const createdUser = await userService.createUser(userData);

    expect(createdUser).toMatchObject({
      id: userData.id,
      name: userData.name,
      email: userData.email,
    });
    expect(userRepositoryRead.findUserByEmail).toHaveBeenCalledWith(userData.email);
  });
});

describe('When creating a user with an existing email', () => {
  it('Should throw RESOURCE_CONFLICT', async () => {
    const userData = validUserMock();
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserByEmail: jest.fn().mockResolvedValue(userData),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock();
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    await expect(userService.createUser(userData)).rejects.toMatchObject({
      status: 409,
      errorCode: EErrorCode.RESOURCE_CONFLICT,
      details: { email: userData.email },
    });
    expect(userRepositoryWrite.createUser).not.toHaveBeenCalled();
  });
});
