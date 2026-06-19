import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

describe('When we try to update a user', () => {
  it('should return the updated user', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const { body, statusCode } = await supertest(app.app)
      .put(`/api/users/${userData.id}`)
      .send({ name: 'Updated Name' });

    expect(statusCode).toBe(200);
    expect(body.name).toBe('Updated Name');
    expect(body.email).toBe(userData.email);
    expect(body.id).toBe(userData.id);
  });

  it('should return 404 when the user does not exist', async () => {
    const { body, statusCode } = await supertest(app.app)
      .put('/api/users/nonexistent-id')
      .send({ name: 'Updated' });

    expect(statusCode).toBe(404);
    expect(body).toMatchObject({
      code: EErrorCode.RESOURCE_NOT_FOUND,
      error: ErrorCatalog[EErrorCode.RESOURCE_NOT_FOUND].en,
    });
  });
});
