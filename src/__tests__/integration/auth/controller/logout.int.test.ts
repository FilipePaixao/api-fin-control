import { createHash } from 'crypto';
import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { RefreshTokenModel } from '../../../../infraestructure/db/mongo/models/refresh-token.model';
import { registerAndLoginUser } from '../../helpers/auth.helper';

describe('When logging out with a valid refresh token', () => {
  it('Should revoke refresh token and return no content', async () => {
    const loginTokens = await registerAndLoginUser();

    const { statusCode: logoutStatus } = await supertest(app.app)
      .post('/api/auth/logout')
      .send({ refreshToken: loginTokens.refreshToken });

    const tokenHash = createHash('sha256')
      .update(loginTokens.refreshToken)
      .digest('hex');
    const revokedToken = await RefreshTokenModel.findOne({ tokenHash });

    expect(logoutStatus).toBe(204);
    expect(revokedToken?.revokedAt).toBeDefined();
  });
});

describe('When logging out with an invalid refresh token', () => {
  it('Should return no content status', async () => {
    const { statusCode } = await supertest(app.app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'invalid-token' });

    expect(statusCode).toBe(204);
  });
});
