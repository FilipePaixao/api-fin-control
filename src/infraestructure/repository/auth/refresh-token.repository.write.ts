import { IRefreshToken } from '../../../domain/auth/entity/interfaces/refresh-token.interface';
import { IRefreshTokenRepositoryWrite } from '../../../domain/auth/repository/refresh-token.repository.write';
import { RefreshTokenModel } from '../../db/mongo/models/refresh-token.model';
import { dbToInternal, internalToDb } from './adapters/refresh-token.adapter';
import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';

export class RefreshTokenRepositoryWrite implements IRefreshTokenRepositoryWrite {
  async createRefreshToken(refreshToken: IRefreshToken): Promise<IRefreshToken> {
    try {
      const doc = await RefreshTokenModel.create(internalToDb(refreshToken));
      return dbToInternal(doc);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'RefreshTokenRepositoryWrite.createRefreshToken',
        eventData: { userId: refreshToken.userId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async revokeById(id: string): Promise<void> {
    try {
      await RefreshTokenModel.updateOne({ id }, { $set: { revokedAt: new Date() } });
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'RefreshTokenRepositoryWrite.revokeById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
