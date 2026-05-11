import { Types } from 'mongoose';
import { IUser } from '../../domain/user/entity/interfaces/user.interface';

export const validUserMock = (override?: Partial<IUser>): IUser => ({
  id: new Types.ObjectId().toHexString(),
  name: 'Almera dos Codes',
  email: override?.email ?? `almera.codes+${Date.now()}@email.com`,
  createdAt: new Date(),
  ...override,
});
