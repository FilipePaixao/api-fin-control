import { UserRepositoryRead } from '../../../../../infraestructure/repository/user/user.repository.read';
import { UserModel } from '../../../../../infraestructure/db/mongo/models/user.model';
import { validUserMock } from '../../../../__mocks__/user.mock';

const repositoryRead = new UserRepositoryRead();

describe('When we try to find a user by email', () => {
  it('should return the user when the email exists', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const found = await repositoryRead.findUserByEmail(userData.email);

    expect(found).toMatchObject({
      email: userData.email,
      name: userData.name,
    });
  });

  it('should return null when the email does not exist', async () => {
    const found = await repositoryRead.findUserByEmail(
      'nonexistent@example.com',
    );
    expect(found).toBeNull();
  });
});
