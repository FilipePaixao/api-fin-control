import { Schema } from 'mongoose';
import type { IMUser } from '../models/user.model';

export const UserSchema = new Schema<IMUser>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
  },
  { timestamps: true },
);
