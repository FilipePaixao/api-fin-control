import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

describe('When we try to delete a user', () => {
  it('should return success when the user exists', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const { body, statusCode } = await supertest(app.app).delete(
      `/api/users/${userData.id}`,
    );

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({ message: 'User deleted successfully' });

    const userInDb = await UserModel.findOne({ id: userData.id });
    expect(userInDb).toBeNull();
  });

  it('should return 404 when the user does not exist', async () => {
    const { body, statusCode } = await supertest(app.app).delete(
      '/api/users/nonexistent-id',
    );

    expect(statusCode).toBe(404);
    expect(body).toMatchObject({
      code: EErrorCode.RESOURCE_NOT_FOUND,
      error: ErrorCatalog[EErrorCode.RESOURCE_NOT_FOUND].en,
    });
  });
});
