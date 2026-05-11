import { UserRepositoryWrite } from '../../../../../infraestructure/repository/user/user.repository.write';
import { validUserMock } from '../../../../__mocks__/user.mock';

const repositoryWrite = new UserRepositoryWrite();

describe('When we try to create a user', () => {
  it('should return the created user as a domain object', async () => {
    const user = validUserMock();

    const created = await repositoryWrite.createUser(user);

    expect(created).toMatchObject({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    expect(created.createdAt).toBeDefined();
  });
});
