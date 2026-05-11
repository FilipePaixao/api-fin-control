import { UserServiceFactory } from '../../../../configuration/factory/user.service.factory';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { validUserMock } from '../../../__mocks__/user.mock';

const userService = UserServiceFactory.create();

describe('When we try to list users', () => {
  it('should return users matching the provided filter', async () => {
    const userData = validUserMock({ name: 'Filtered User' });
    await UserModel.create(userData);

    const result = await userService.listUsers({ name: 'Filtered User' });

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((u) => u.email === userData.email)).toBe(true);
  });

  it('should return all users when no filter is provided', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const result = await userService.listUsers({});

    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
