import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserService } from '../../../../domain/user/service/user.service';
import { validUserMock } from '../../../__mocks__/user.mock';
import {
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When updating a user by id that exists', () => {
  it('Should return the updated user', async () => {
    const userData = validUserMock();
    const updatedUser = { ...userData, name: 'Updated Name' };
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue(userData),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock({
      updateUserById: jest.fn().mockResolvedValue(updatedUser),
    });
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    const user = await userService.updateUserById(userData.id, {
      userData: { name: 'Updated Name' },
    });

    expect(user.name).toBe('Updated Name');
    expect(userRepositoryWrite.updateUserById).toHaveBeenCalledWith(userData.id, {
      name: 'Updated Name',
    });
  });

  it('Should merge partial profile with existing profile before persisting', async () => {
    const userData = validUserMock({
      profile: {
        address: {
          zipCode: '01310100',
          street: 'Avenida Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          number: '100',
        },
      },
    });
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue(userData),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock({
      updateUserById: jest.fn().mockImplementation((_id, data) =>
        Promise.resolve({ ...userData, ...data }),
      ),
    });
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    await userService.updateUserById(userData.id, {
      userData: {
        profile: {
          occupationArea: 'Tecnologia',
        },
      },
    });

    expect(userRepositoryWrite.updateUserById).toHaveBeenCalledWith(userData.id, {
      profile: {
        address: userData.profile?.address,
        occupationArea: 'Tecnologia',
      },
    });
  });
});

describe('When updating a user by id that does not exist', () => {
  it('Should throw RESOURCE_NOT_FOUND', async () => {
    const userRepositoryRead = createUserRepositoryReadMock({
      findUserById: jest.fn().mockResolvedValue(null),
    });
    const userRepositoryWrite = createUserRepositoryWriteMock();
    const userService = new UserService({ userRepositoryRead, userRepositoryWrite });

    await expect(
      userService.updateUserById('missing-id', { userData: { name: 'Updated' } }),
    ).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
      details: { id: 'missing-id' },
    });
  });
});
