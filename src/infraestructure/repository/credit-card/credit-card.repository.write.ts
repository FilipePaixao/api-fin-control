import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { ICreditCard } from '../../../domain/credit-card/entity/interfaces/credit-card.interface';
import { ICreditCardRepositoryWrite } from '../../../domain/credit-card/repository/credit-card.repository.write';
import { CreditCardModel } from '../../db/mongo/models/credit-card.model';
import { dbToInternal, internalToDb } from './adapters/credit-card.adapter';

export class CreditCardRepositoryWrite implements ICreditCardRepositoryWrite {
  async create(card: ICreditCard): Promise<ICreditCard> {
    try {
      const created = await CreditCardModel.create(internalToDb(card));
      return dbToInternal(created);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'CreditCardRepositoryWrite.create',
        eventData: { cardId: card.id, userId: card.userId },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async updateById(
    id: string,
    payload: Partial<ICreditCard>,
  ): Promise<ICreditCard | null> {
    try {
      const unset: Record<string, 1> = {};
      const set: Record<string, unknown> = { ...payload };

      if (
        Object.prototype.hasOwnProperty.call(payload, 'lastFourDigits') &&
        (payload.lastFourDigits === undefined || payload.lastFourDigits === '')
      ) {
        delete set.lastFourDigits;
        unset.lastFourDigits = 1;
      }

      const update: Record<string, unknown> = { $set: set };
      if (Object.keys(unset).length) {
        update.$unset = unset;
      }

      const updated = await CreditCardModel.findOneAndUpdate({ id }, update, {
        new: true,
      });
      return updated ? dbToInternal(updated) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'CreditCardRepositoryWrite.updateById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }

  async deleteById(id: string): Promise<ICreditCard | null> {
    try {
      const deleted = await CreditCardModel.findOneAndDelete({ id });
      return deleted ? dbToInternal(deleted) : null;
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'CreditCardRepositoryWrite.deleteById',
        eventData: { id },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
