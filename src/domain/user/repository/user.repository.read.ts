import { IUser } from '../entity/interfaces/user.interface';

export interface IUserRepositoryRead {
  findUserByEmail(email: string): Promise<IUser | null>;
  findUserByEmailWithPasswordHash(email: string): Promise<IUser | null>;
  findUserById(id: string): Promise<IUser | null>;
  findUserByDocument(documentValue: string): Promise<IUser | null>;
  listUsers(filter: Partial<IUser>): Promise<IUser[]>;
}
