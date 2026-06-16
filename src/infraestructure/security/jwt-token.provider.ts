import { randomBytes } from 'crypto';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import {
  IAccessTokenPayload,
  IAuthTokenProvider,
  IGeneratedAccessToken,
} from '../../domain/auth/interfaces/auth-token-provider.interface';
import {
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  JWT_SECRET,
} from '../../configuration/env-constants/env.constants';

function parseDurationToMilliseconds(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

export class JwtTokenProvider implements IAuthTokenProvider {
  generateAccessToken(userId: string): IGeneratedAccessToken {
    const token = jwt.sign({ sub: userId }, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
    const decoded = jwt.decode(token) as JwtPayload;
    const expiresIn =
      decoded.exp !== undefined
        ? decoded.exp - Math.floor(Date.now() / 1000)
        : parseDurationToMilliseconds(JWT_ACCESS_EXPIRES_IN) / 1000;

    return { token, expiresIn };
  }

  verifyAccessToken(token: string): IAccessTokenPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      if (!payload.sub || typeof payload.sub !== 'string') {
        throw new Error('Invalid token payload');
      }
      return { sub: payload.sub };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw {
          status: 401,
          errorCode: 'AUTH_TOKEN_EXPIRED',
          message: 'Access token has expired',
        };
      }
      throw {
        status: 401,
        errorCode: 'AUTH_UNAUTHORIZED',
        message: 'Invalid access token',
      };
    }
  }

  generateRefreshTokenValue(): string {
    return randomBytes(32).toString('hex');
  }

  getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + parseDurationToMilliseconds(JWT_REFRESH_EXPIRES_IN));
  }
}
