import { Types } from 'mongoose';
import { RefreshTokenRepositoryRead } from '../../../../../infraestructure/repository/auth/refresh-token.repository.read';
import { RefreshTokenModel } from '../../../../../infraestructure/db/mongo/models/refresh-token.model';

const repositoryRead = new RefreshTokenRepositoryRead();

describe('When finding refresh token by hash and token exists', () => {
  it('Should return refresh token as domain object', async () => {
    const refreshToken = {
      id: new Types.ObjectId().toHexString(),
      userId: new Types.ObjectId().toHexString(),
      tokenHash: `hash-${Date.now()}`,
      expiresAt: new Date(Date.now() + 60_000),
    };
    await RefreshTokenModel.create(refreshToken);

    const foundToken = await repositoryRead.findByTokenHash(refreshToken.tokenHash);

    expect(foundToken).toMatchObject({
      id: refreshToken.id,
      userId: refreshToken.userId,
      tokenHash: refreshToken.tokenHash,
    });
  });
});

describe('When finding refresh token by hash and token does not exist', () => {
  it('Should return null', async () => {
    const foundToken = await repositoryRead.findByTokenHash('unknown-token-hash');
    expect(foundToken).toBeNull();
  });
});
