import { IRefreshToken } from '../../../../domain/auth/entity/interfaces/refresh-token.interface';
import { IMRefreshToken } from '../../../db/mongo/interfaces/refresh-token.interface';

export function dbToInternal(refreshToken: IMRefreshToken): IRefreshToken {
  return {
    id: refreshToken.id,
    userId: refreshToken.userId,
    tokenHash: refreshToken.tokenHash,
    expiresAt: refreshToken.expiresAt,
    createdAt: refreshToken.createdAt,
    revokedAt: refreshToken.revokedAt,
  };
}

export function internalToDb(
  refreshToken: IRefreshToken,
): Omit<IMRefreshToken, '_id'> {
  return {
    id: refreshToken.id,
    userId: refreshToken.userId,
    tokenHash: refreshToken.tokenHash,
    expiresAt: refreshToken.expiresAt,
    createdAt: refreshToken.createdAt,
    revokedAt: refreshToken.revokedAt,
  };
}
