import { createHash } from 'crypto';
import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { RefreshTokenModel } from '../../../../infraestructure/db/mongo/models/refresh-token.model';
import { registerAndLoginUser } from '../../helpers/auth.helper';

describe('When refreshing session with a valid refresh token', () => {
  it('Should rotate refresh token and revoke previous token', async () => {
    const loginTokens = await registerAndLoginUser();

    const { body, statusCode } = await supertest(app.app)
      .post('/api/auth/refresh')
      .send({ refreshToken: loginTokens.refreshToken });

    const oldTokenHash = createHash('sha256')
      .update(loginTokens.refreshToken)
      .digest('hex');
    const revokedOldToken = await RefreshTokenModel.findOne({ tokenHash: oldTokenHash });

    expect(statusCode).toBe(200);
    expect(body.refreshToken).toBeDefined();
    expect(body.refreshToken).not.toBe(loginTokens.refreshToken);
    expect(revokedOldToken?.revokedAt).toBeDefined();
  });
});

describe('When refreshing session with an invalid refresh token', () => {
  it('Should return unauthorized status', async () => {
    const { statusCode } = await supertest(app.app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(statusCode).toBe(401);
  });
});
