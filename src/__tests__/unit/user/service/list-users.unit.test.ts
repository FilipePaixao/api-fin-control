import { UserService } from '../../../../domain/user/service/user.service';
import { validUserMock } from '../../../__mocks__/user.mock';
import {
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When listing users with a valid filter', () => {
  it('Should return matching users', async () => {
    const users = [validUserMock(), validUserMock()];
    const userRepositoryRead = createUserRepositoryReadMock({
      listUsers: jest.fn().mockResolvedValue(users),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock();
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    const result = await userService.listUsers({ name: users[0].name });

    expect(result).toHaveLength(2);
    expect(userRepositoryRead.listUsers).toHaveBeenCalledWith({ name: users[0].name });
  });
});
