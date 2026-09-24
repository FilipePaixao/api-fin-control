import {
  ICreateCreditCardInput,
  ICreditCard,
  IUpdateCreditCardInput,
} from '../entity/interfaces/credit-card.interface';
import { ICreditCardRepositoryRead } from '../repository/credit-card.repository.read';
import { ICreditCardRepositoryWrite } from '../repository/credit-card.repository.write';
import { IExpenseService } from '../../expense/interfaces/expense.service.interface';

export interface IParamsCreditCardService {
  creditCardRepositoryRead: ICreditCardRepositoryRead;
  creditCardRepositoryWrite: ICreditCardRepositoryWrite;
  expenseService: IExpenseService;
}

export interface ICreditCardService {
  create(userId: string, payload: Omit<ICreateCreditCardInput, 'userId'>): Promise<ICreditCard>;
  list(userId: string): Promise<ICreditCard[]>;
  getById(userId: string, id: string): Promise<ICreditCard>;
  update(
    userId: string,
    id: string,
    payload: IUpdateCreditCardInput,
  ): Promise<ICreditCard>;
  delete(userId: string, id: string): Promise<void>;
}
