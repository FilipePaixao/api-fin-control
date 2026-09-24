import { ICreditCard } from '../entity/interfaces/credit-card.interface';

export interface ICreditCardRepositoryRead {
  findById(id: string): Promise<ICreditCard | null>;
  listByUserId(userId: string): Promise<ICreditCard[]>;
}
