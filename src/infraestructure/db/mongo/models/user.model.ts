import { Types, model } from 'mongoose';
import { IUser } from '../../../../domain/user/entity/interfaces/user.interface';
import { UserSchema } from '../schema/user.schema';

export interface IMUser extends Omit<IUser, '_id'> {
  _id: Types.ObjectId;
  updatedAt: Date;
}

export const UserModel = model<IMUser>('User', UserSchema);
