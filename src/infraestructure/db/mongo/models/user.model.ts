import { model } from 'mongoose';
import { IMUser } from '../interfaces/user.interface';
import { UserSchema } from '../schema/user.schema';

export const UserModel = model<IMUser>('User', UserSchema);
