import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EDocumentType } from '../../../../domain/user/entity/enums/EDocumentType';
import { RefreshTokenModel } from '../../../../infraestructure/db/mongo/models/refresh-token.model';
import { createHash } from 'crypto';

const credentials = {
  name: 'Login User',
  email: 'login.user@email.com',
  password: 'StrongPassword123',
  document: { type: EDocumentType.CPF, value: '11122233344' },
};

describe('when logging in via auth', () => {
  beforeEach(async () => {
    await supertest(app.app).post('/api/auth/register').send(credentials);
  });

  it('should return access and refresh tokens on valid credentials', async () => {
    const { body, statusCode } = await supertest(app.app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    const storedTokens = await RefreshTokenModel.find({});

    expect(statusCode).toBe(200);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.expiresIn).toBeGreaterThan(0);
    expect(storedTokens.length).toBeGreaterThan(0);
    expect(storedTokens.some(
      (token) =>
        token.tokenHash === createHash('sha256').update(body.refreshToken).digest('hex'),
    )).toBe(true);
  });

  it('should return unauthorized for invalid password', async () => {
    const { statusCode } = await supertest(app.app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'WrongPassword1' });

    expect(statusCode).toBe(401);
  });
});
