import { ICreditCard } from '../entity/interfaces/credit-card.interface';

export interface ICreditCardRepositoryWrite {
  create(card: ICreditCard): Promise<ICreditCard>;
  updateById(id: string, payload: Partial<ICreditCard>): Promise<ICreditCard | null>;
  deleteById(id: string): Promise<ICreditCard | null>;
}
