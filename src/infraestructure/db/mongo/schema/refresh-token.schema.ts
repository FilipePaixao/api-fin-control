import { Schema } from 'mongoose';
import type { IMRefreshToken } from '../interfaces/refresh-token.interface';

export const RefreshTokenSchema = new Schema<IMRefreshToken>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
