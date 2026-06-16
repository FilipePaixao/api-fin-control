import { Types } from 'mongoose';
import { EErrorCode } from '../../../../../domain/common/errors/enums/EErrorCode';
import { RefreshTokenRepositoryWrite } from '../../../../../infraestructure/repository/auth/refresh-token.repository.write';
import { RefreshTokenModel } from '../../../../../infraestructure/db/mongo/models/refresh-token.model';

const repositoryWrite = new RefreshTokenRepositoryWrite();

describe('When creating refresh token with valid payload', () => {
  it('Should persist and return refresh token as domain object', async () => {
    const refreshToken = {
      id: new Types.ObjectId().toHexString(),
      userId: new Types.ObjectId().toHexString(),
      tokenHash: `hash-${Date.now()}`,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    };

    const createdToken = await repositoryWrite.createRefreshToken(refreshToken);
    const persistedToken = await RefreshTokenModel.findOne({ id: refreshToken.id });

    expect(createdToken).toMatchObject({
      id: refreshToken.id,
      userId: refreshToken.userId,
      tokenHash: refreshToken.tokenHash,
    });
    expect(persistedToken).not.toBeNull();
  });
});

describe('When creating refresh token with duplicated token hash', () => {
  it('Should throw DATABASE_ERROR', async () => {
    const tokenHash = `hash-duplicate-${Date.now()}`;
    await RefreshTokenModel.create({
      id: new Types.ObjectId().toHexString(),
      userId: new Types.ObjectId().toHexString(),
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      repositoryWrite.createRefreshToken({
        id: new Types.ObjectId().toHexString(),
        userId: new Types.ObjectId().toHexString(),
        tokenHash,
        expiresAt: new Date(Date.now() + 120_000),
        createdAt: new Date(),
      }),
    ).rejects.toMatchObject({
      status: 500,
      errorCode: EErrorCode.DATABASE_ERROR,
    });
  });
});
