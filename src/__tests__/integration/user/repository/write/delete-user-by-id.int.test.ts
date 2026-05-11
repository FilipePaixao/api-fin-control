import { UserRepositoryWrite } from '../../../../../infraestructure/repository/user/user.repository.write';
import { UserModel } from '../../../../../infraestructure/db/mongo/models/user.model';
import { validUserMock } from '../../../../__mocks__/user.mock';

const repositoryWrite = new UserRepositoryWrite();

describe('When we try to delete a user by id', () => {
  it('should return the deleted user', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const deleted = await repositoryWrite.deleteUserById(userData.id);

    expect(deleted?.id).toBe(userData.id);
  });

  it('should not find the user after deletion', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    await repositoryWrite.deleteUserById(userData.id);
    const found = await UserModel.findOne({ id: userData.id });

    expect(found).toBeNull();
  });
});
