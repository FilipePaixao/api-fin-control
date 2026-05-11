import { IUser } from '../../../../domain/user/entity/interfaces/user.interface';
import { IMUser } from '../../../db/mongo/interfaces/user.interface';

export function dbToInternal(user: IMUser): IUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export function internalToDb(user: IUser): Omit<IMUser, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
