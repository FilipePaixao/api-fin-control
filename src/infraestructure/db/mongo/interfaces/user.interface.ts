import { Types } from 'mongoose';
import { IUser } from '../../../../domain/user/entity/interfaces/user.interface';

export interface IMUser extends IUser {
  _id: Types.ObjectId;
  updatedAt: Date;
}
