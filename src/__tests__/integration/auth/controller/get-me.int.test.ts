import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { createAuthenticatedUser } from '../../helpers/auth.helper';

describe('when accessing authenticated profile', () => {
  it('should return user profile without password hash', async () => {
    const { user, token } = await createAuthenticatedUser({
      name: 'Profile User',
      email: 'profile.user@email.com',
    });

    const { body, statusCode } = await supertest(app.app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    expect(body.passwordHash).toBeUndefined();
  });

  it('should return unauthorized without token', async () => {
    const { statusCode } = await supertest(app.app).get('/api/me');
    expect(statusCode).toBe(401);
  });
});
