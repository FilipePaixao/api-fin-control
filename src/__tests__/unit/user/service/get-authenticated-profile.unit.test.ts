import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserService } from '../../../../domain/user/service/user.service';
import { validUserMock } from '../../../__mocks__/user.mock';
import {
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When getting an authenticated profile for an existing user', () => {
  it('Should return the user profile without passwordHash', async () => {
    const userData = validUserMock({ passwordHash: 'hashed' });
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue(userData),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock();
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    const profile = await userService.getAuthenticatedProfile(userData.id);

    expect(profile).toMatchObject({
      id: userData.id,
      name: userData.name,
      email: userData.email,
    });
    expect((profile as { passwordHash?: string }).passwordHash).toBeUndefined();
  });
});

describe('When getting an authenticated profile for a missing user', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue(null),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock();
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    await expect(userService.getAuthenticatedProfile('missing-id')).rejects.toMatchObject(
      {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        details: { id: 'missing-id' },
      },
    );
  });
});
