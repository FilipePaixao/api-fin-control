import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { validUserMock } from '../../../__mocks__/user.mock';

const paramsCreate = validUserMock({
  name: 'Whitebeard',
  email: 'whitebeard@email.com',
});

describe('When we try to create a valid user', () => {
  it('should return success and the created user', async () => {
    const { body, statusCode } = await supertest(app.app)
      .post(`/users`)
      .send(paramsCreate);

    const userInDb = await UserModel.findOne({ id: paramsCreate.id });

    expect(body).toMatchObject({
      id: paramsCreate.id,
      name: paramsCreate.name,
      email: paramsCreate.email,
    });
    expect(body.createdAt).toBeDefined();
    expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
    expect(statusCode).toBe(201);
    expect(userInDb).toMatchObject({
      id: paramsCreate.id,
      name: paramsCreate.name,
      email: paramsCreate.email,
    });
  });
});
