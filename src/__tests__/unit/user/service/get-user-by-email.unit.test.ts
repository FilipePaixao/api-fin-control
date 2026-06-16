import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserService } from '../../../../domain/user/service/user.service';
import { validUserMock } from '../../../__mocks__/user.mock';
import {
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When getting a user by email that exists', () => {
  it('Should return the user', async () => {
    const userData = validUserMock();
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserByEmail: jest.fn().mockResolvedValue(userData),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock();
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    const user = await userService.getUserByEmail(userData.email);

    expect(user).toMatchObject({ id: userData.id, email: userData.email });
  });
});

describe('When getting a user by email that does not exist', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserByEmail: jest.fn().mockResolvedValue(null),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock();
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    await expect(
      userService.getUserByEmail('missing@email.com'),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { email: 'missing@email.com' },
    });
  });
});
