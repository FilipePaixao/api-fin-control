import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { createAuthenticatedUser } from '../../../integration/helpers/auth.helper';

describe('when updating authenticated user salary', () => {
  it('should update salary successfully', async () => {
    const { user, token } = await createAuthenticatedUser();
    const payload = {
      amount: 7500,
      currency: ECurrency.BRL,
      paymentDay: 5,
      source: 'Main job',
    };

    const { body, statusCode } = await supertest(app.app)
      .put('/api/users/me/salary')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    const userInDatabase = await UserModel.findOne({ id: user.id });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      amount: payload.amount,
      currency: payload.currency,
      paymentDay: payload.paymentDay,
      source: payload.source,
    });
    expect(userInDatabase?.salary).toMatchObject({
      amount: payload.amount,
      currency: payload.currency,
    });
  });

  it('should return unauthorized when access token is missing', async () => {
    const { statusCode } = await supertest(app.app).put('/api/users/me/salary').send({
      amount: 1000,
      currency: ECurrency.BRL,
    });

    expect(statusCode).toBe(401);
  });
});
