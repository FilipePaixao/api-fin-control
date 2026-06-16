import { model } from 'mongoose';
import { IMRefreshToken } from '../interfaces/refresh-token.interface';
import { RefreshTokenSchema } from '../schema/refresh-token.schema';

export const RefreshTokenModel = model<IMRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema,
);
