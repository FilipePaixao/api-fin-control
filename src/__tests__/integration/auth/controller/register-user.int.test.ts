import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EDocumentType } from '../../../../domain/user/entity/enums/EDocumentType';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';

const registerPayload = {
  name: 'Filipe Paixão',
  email: 'filipe.register@email.com',
  password: 'StrongPassword123',
  document: { type: EDocumentType.CPF, value: '12345678901' },
  age: 25,
};

describe('when registering a user via auth', () => {
  it('should register user without exposing password hash', async () => {
    const { body, statusCode } = await supertest(app.app)
      .post('/api/auth/register')
      .send(registerPayload);

    const userInDatabase = await UserModel.findOne({ email: registerPayload.email }).select(
      '+passwordHash',
    );

    expect(statusCode).toBe(201);
    expect(body).toMatchObject({
      user: {
        name: registerPayload.name,
        email: registerPayload.email,
        document: registerPayload.document,
        onboardingRequired: true,
      },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresIn: expect.any(Number),
      onboardingRequired: true,
    });
    expect(body.user.passwordHash).toBeUndefined();
    expect(userInDatabase?.passwordHash).toBeDefined();
    expect(userInDatabase?.passwordHash).not.toBe(registerPayload.password);
  });

  it('should return conflict when email is duplicated', async () => {
    await supertest(app.app).post('/api/auth/register').send(registerPayload);

    const { statusCode } = await supertest(app.app)
      .post('/api/auth/register')
      .send({
        ...registerPayload,
        document: { type: EDocumentType.CPF, value: '98765432100' },
      });

    expect(statusCode).toBe(409);
  });
});
