import { ICreditCard } from '../../../../domain/credit-card/entity/interfaces/credit-card.interface';
import { IMCreditCard } from '../../../db/mongo/interfaces/credit-card.interface';

export function dbToInternal(card: IMCreditCard): ICreditCard {
  return {
    id: card.id,
    userId: card.userId,
    name: card.name,
    lastFourDigits: card.lastFourDigits,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

export function internalToDb(
  card: ICreditCard,
): Omit<IMCreditCard, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    id: card.id,
    userId: card.userId,
    name: card.name,
    lastFourDigits: card.lastFourDigits,
  };
}
