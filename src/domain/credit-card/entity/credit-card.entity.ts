import { generateId } from '../../common/utils/generate-id';
import {
  ICreateCreditCardInput,
  ICreditCard,
} from './interfaces/credit-card.interface';

const LAST_FOUR_REGEX = /^\d{4}$/;

export class CreditCardEntity implements ICreditCard {
  id: string;
  userId: string;
  name: string;
  lastFourDigits?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(input: ICreditCard | (ICreateCreditCardInput & { id?: string })) {
    CreditCardEntity.validateCreateInput(input);
    this.id = input.id || generateId();
    this.userId = input.userId;
    this.name = input.name.trim();
    this.lastFourDigits = input.lastFourDigits?.trim() || undefined;
    this.createdAt =
      'createdAt' in input && input.createdAt ? input.createdAt : new Date();
    this.updatedAt =
      'updatedAt' in input && input.updatedAt ? input.updatedAt : new Date();
  }

  static validateCreateInput(
    input: Partial<ICreditCard> & { userId?: string; name?: string; lastFourDigits?: string },
  ): void {
    if (!input.userId?.trim()) {
      throw new Error('User ID is required');
    }
    if (!input.name?.trim()) {
      throw new Error('Credit card name is required');
    }
    if (
      input.lastFourDigits !== undefined &&
      input.lastFourDigits !== null &&
      String(input.lastFourDigits).length > 0 &&
      !LAST_FOUR_REGEX.test(String(input.lastFourDigits).trim())
    ) {
      throw new Error('lastFourDigits must be exactly 4 digits');
    }
  }

  static validateLastFourDigits(value: string | null | undefined): void {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (!LAST_FOUR_REGEX.test(String(value).trim())) {
      throw new Error('lastFourDigits must be exactly 4 digits');
    }
  }
}
