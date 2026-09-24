import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { CreditCardEntity } from '../entity/credit-card.entity';
import {
  ICreateCreditCardInput,
  ICreditCard,
  IUpdateCreditCardInput,
} from '../entity/interfaces/credit-card.interface';
import {
  ICreditCardService,
  IParamsCreditCardService,
} from '../interfaces/credit-card.service.interface';

export class CreditCardService implements ICreditCardService {
  private readonly creditCardRepositoryRead: IParamsCreditCardService['creditCardRepositoryRead'];
  private readonly creditCardRepositoryWrite: IParamsCreditCardService['creditCardRepositoryWrite'];
  private readonly expenseService: IParamsCreditCardService['expenseService'];

  constructor({
    creditCardRepositoryRead,
    creditCardRepositoryWrite,
    expenseService,
  }: IParamsCreditCardService) {
    this.creditCardRepositoryRead = creditCardRepositoryRead;
    this.creditCardRepositoryWrite = creditCardRepositoryWrite;
    this.expenseService = expenseService;
  }

  async create(
    userId: string,
    payload: Omit<ICreateCreditCardInput, 'userId'>,
  ): Promise<ICreditCard> {
    try {
      const entity = new CreditCardEntity({ ...payload, userId });
      return this.creditCardRepositoryWrite.create(entity);
    } catch (error) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid credit card',
      } as IThrowedError;
    }
  }

  async list(userId: string): Promise<ICreditCard[]> {
    return this.creditCardRepositoryRead.listByUserId(userId);
  }

  async getById(userId: string, id: string): Promise<ICreditCard> {
    const card = await this.creditCardRepositoryRead.findById(id);
    this.assertOwnership(card, userId, id);
    return card;
  }

  async update(
    userId: string,
    id: string,
    payload: IUpdateCreditCardInput,
  ): Promise<ICreditCard> {
    const existing = await this.creditCardRepositoryRead.findById(id);
    this.assertOwnership(existing, userId, id);

    try {
      if (payload.name !== undefined && !payload.name.trim()) {
        throw new Error('Credit card name is required');
      }
      CreditCardEntity.validateLastFourDigits(
        payload.lastFourDigits === null ? undefined : payload.lastFourDigits,
      );
    } catch (error) {
      throw {
        status: 400,
        errorCode: EErrorCode.FIELD_INVALID,
        message: error instanceof Error ? error.message : 'Invalid credit card',
      } as IThrowedError;
    }

    const updated = await this.creditCardRepositoryWrite.updateById(id, {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.lastFourDigits !== undefined
        ? {
            lastFourDigits:
              payload.lastFourDigits === null || payload.lastFourDigits === ''
                ? undefined
                : payload.lastFourDigits.trim(),
          }
        : {}),
      updatedAt: new Date(),
    });
    this.assertOwnership(updated, userId, id);
    return updated;
  }

  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.creditCardRepositoryRead.findById(id);
    this.assertOwnership(existing, userId, id);

    const linked = await this.expenseService.listExpenses(userId, {
      creditCardId: id,
    });
    if (linked.length > 0) {
      throw {
        status: 400,
        errorCode: EErrorCode.CREDIT_CARD_IN_USE,
        message: 'Credit card has linked expenses',
        details: { creditCardId: id, expenseCount: linked.length },
      } as IThrowedError;
    }

    await this.creditCardRepositoryWrite.deleteById(id);
  }

  private assertOwnership(
    card: ICreditCard | null,
    userId: string,
    id: string,
  ): asserts card is ICreditCard {
    if (!card || card.userId !== userId) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'Credit card not found',
        details: { creditCardId: id },
      } as IThrowedError;
    }
  }
}
