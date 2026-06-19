import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

describe('When we try to get a user by id', () => {
  it('should return the user when it exists', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const { body, statusCode } = await supertest(app.app).get(
      `/api/users/${userData.id}`,
    );

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      id: userData.id,
      name: userData.name,
      email: userData.email,
    });
  });

  it('should return 404 when the user does not exist', async () => {
    const { body, statusCode } = await supertest(app.app).get(
      '/api/users/nonexistent-id',
    );

    expect(statusCode).toBe(404);
    expect(body).toMatchObject({
      code: EErrorCode.RESOURCE_NOT_FOUND,
      error: ErrorCatalog[EErrorCode.RESOURCE_NOT_FOUND].en,
    });
  });
});
