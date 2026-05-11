import { UserRepositoryRead } from '../../../../../infraestructure/repository/user/user.repository.read';
import { UserModel } from '../../../../../infraestructure/db/mongo/models/user.model';
import { validUserMock } from '../../../../__mocks__/user.mock';

const repositoryRead = new UserRepositoryRead();

describe('When we try to find a user by id', () => {
  it('should return the user when it exists', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const found = await repositoryRead.findUserById(userData.id);

    expect(found).toMatchObject({
      id: userData.id,
      name: userData.name,
      email: userData.email,
    });
  });

  it('should return null when the user does not exist', async () => {
    const found = await repositoryRead.findUserById('nonexistent-id');
    expect(found).toBeNull();
  });
});
