import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserService } from '../../../../domain/user/service/user.service';
import { validUserMock } from '../../../__mocks__/user.mock';
import {
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When deleting a user by id that exists', () => {
  it('Should return the deleted user', async () => {
    const userData = validUserMock();
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue(userData),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock({
      deleteUserById: jest.fn().mockResolvedValue(userData),
    });
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    const deletedUser = await userService.deleteUserById(userData.id);

    expect(deletedUser.id).toBe(userData.id);
    expect(userRepositoryWrite.deleteUserById).toHaveBeenCalledWith(userData.id);
  });
});

describe('When deleting a user by id that does not exist', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue(null),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock();
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    await expect(userService.deleteUserById('missing-id')).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { id: 'missing-id' },
    });
  });
});
