import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { ICreditCard } from '../../../domain/credit-card/entity/interfaces/credit-card.interface';
import { ICreditCardRepositoryRead } from '../../../domain/credit-card/repository/credit-card.repository.read';
import { CreditCardModel } from '../../db/mongo/models/credit-card.model';
import { dbToInternal } from './adapters/credit-card.adapter';

export class CreditCardRepositoryRead implements ICreditCardRepositoryRead {
  async findById(id: string): Promise<ICreditCard | null> {
    try {
      const card = await CreditCardModel.findOne({ id });
      return card ? dbToInternal(card) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'CreditCardRepositoryRead.findById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async listByUserId(userId: string): Promise<ICreditCard[]> {
    try {
      const cards = await CreditCardModel.find({ userId }).sort({ name: 1 });
      return cards.map(dbToInternal);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'CreditCardRepositoryRead.listByUserId',
        eventData: { userId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
