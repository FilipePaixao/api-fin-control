import { IUser } from '../../../domain/user/entity/interfaces/user.interface';
import { IUserRepositoryWrite } from '../../../domain/user/repository/user.repository.write';
import { UserModel } from '../../db/mongo/models/user.model';
import { dbToInternal, internalToDb } from './adapters/user.adapter';
import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';

export class UserRepositoryWrite implements IUserRepositoryWrite {
  async createUser(userData: IUser): Promise<IUser> {
    try {
      const user = await UserModel.create(internalToDb(userData));
      return dbToInternal(user);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'UserRepositoryWrite.createUser',
        eventData: { userData },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async updateUserById(
    id: string,
    updateData: Partial<IUser>,
  ): Promise<IUser | null> {
    try {
      const user = await UserModel.findOneAndUpdate(
        { id },
        { $set: updateData },
        { new: true },
      );
      return user ? dbToInternal(user) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'UserRepositoryWrite.updateUserById',
        eventData: { id, updateData },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async deleteUserById(id: string): Promise<IUser | null> {
    try {
      const user = await UserModel.findOneAndDelete({ id });
      return user ? dbToInternal(user) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'UserRepositoryWrite.deleteUserById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
