import { Types } from 'mongoose';
import { RefreshTokenRepositoryWrite } from '../../../../../infraestructure/repository/auth/refresh-token.repository.write';
import { RefreshTokenModel } from '../../../../../infraestructure/db/mongo/models/refresh-token.model';

const repositoryWrite = new RefreshTokenRepositoryWrite();

describe('When revoking refresh token by an existing id', () => {
  it('Should set revokedAt in persistence', async () => {
    const token = await RefreshTokenModel.create({
      id: new Types.ObjectId().toHexString(),
      userId: new Types.ObjectId().toHexString(),
      tokenHash: `hash-${Date.now()}`,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await repositoryWrite.revokeById(token.id);

    const revokedToken = await RefreshTokenModel.findOne({ id: token.id });
    expect(revokedToken?.revokedAt).toBeDefined();
  });
});

describe('When revoking refresh token by a non-existing id', () => {
  it('Should resolve without throwing', async () => {
    await expect(
      repositoryWrite.revokeById(new Types.ObjectId().toHexString()),
    ).resolves.toBeUndefined();
  });
});
