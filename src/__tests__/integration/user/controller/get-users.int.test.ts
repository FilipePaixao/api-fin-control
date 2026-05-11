import { EUserGroup } from '@sauvvitech/st-packages';
import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { validUserMock } from '../../../__mocks__/user.mock';

describe('When we try to list all users', () => {
  it('should return the list of users', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const { body, statusCode } = await supertest(app.app)
      .get('/users')
      .set('x-user-groups', EUserGroup.BACKOFFICE);

    expect(statusCode).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((u: { id: string }) => u.id === userData.id)).toBe(true);
  });
});
