import { IUser } from '../../../../domain/user/entity/interfaces/user.interface';
import { IUserProfile } from '../../../../domain/user/entity/interfaces/user-profile.interface';
import { IMUser } from '../../../db/mongo/models/user.model';

function profileToInternal(profile: IUserProfile | undefined): IUserProfile | undefined {
  if (!profile) {
    return undefined;
  }

  const mongooseProfile = profile as IUserProfile & {
    toObject?: () => IUserProfile;
  };

  return typeof mongooseProfile.toObject === 'function'
    ? mongooseProfile.toObject()
    : profile;
}

export function dbToInternal(user: IMUser): IUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    document: user.document,
    salary: user.salary,
    age: user.age,
    profile: profileToInternal(user.profile),
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
    profile: user.profile,
  };
}

export function toUserPublic(user: IUser): Omit<IUser, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
