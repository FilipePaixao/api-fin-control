import { IUser } from '../../../../domain/user/entity/interfaces/user.interface';
import { IMUser } from '../../../db/mongo/models/user.model';

export function dbToInternal(user: IMUser): IUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    document: user.document,
    salary: user.salary,
    age: user.age,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function internalToDb(
  user: IUser,
): Omit<IMUser, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    document: user.document,
    salary: user.salary,
    age: user.age,
  };
}

export function toUserPublic(user: IUser): Omit<IUser, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
