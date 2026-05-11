import { UserRepositoryRead } from '../../../../../infraestructure/repository/user/user.repository.read';
import { UserModel } from '../../../../../infraestructure/db/mongo/models/user.model';
import { validUserMock } from '../../../../__mocks__/user.mock';

const repositoryRead = new UserRepositoryRead();

describe('When we try to list users', () => {
  it('should return users matching the provided filter', async () => {
    const userData = validUserMock({ name: 'Filtered User' });
    await UserModel.create(userData);

    const users = await repositoryRead.listUsers({ name: 'Filtered User' });

    expect(users.length).toBeGreaterThanOrEqual(1);
    expect(users.some((u) => u.email === userData.email)).toBe(true);
  });
});
