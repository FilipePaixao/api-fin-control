import { IRefreshToken } from '../../../domain/auth/entity/interfaces/refresh-token.interface';
import { IRefreshTokenRepositoryRead } from '../../../domain/auth/repository/refresh-token.repository.read';
import { RefreshTokenModel } from '../../db/mongo/models/refresh-token.model';
import { dbToInternal } from './adapters/refresh-token.adapter';
import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';

export class RefreshTokenRepositoryRead implements IRefreshTokenRepositoryRead {
  async findByTokenHash(tokenHash: string): Promise<IRefreshToken | null> {
    try {
      const doc = await RefreshTokenModel.findOne({ tokenHash });
      return doc ? dbToInternal(doc) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'RefreshTokenRepositoryRead.findByTokenHash',
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
