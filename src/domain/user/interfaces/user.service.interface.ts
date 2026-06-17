import { IUserRepositoryRead } from '../repository/user.repository.read';
import { IUserRepositoryWrite } from '../repository/user.repository.write';
import { ECurrency } from '../entity/enums/ECurrency';
import { ISalary } from '../entity/interfaces/salary.interface';
import { IUser } from '../entity/interfaces/user.interface';

export interface IParamsCreateUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface IParamsUpdateUser {
  userData: Partial<IUser>;
}

export interface IUpdateSalaryInput {
  amount: number;
  currency: ECurrency;
  paymentDay?: number;
  source?: string;
}

export interface IParamsUserService {
  userRepositoryRead: IUserRepositoryRead;
  userRepositoryWrite: IUserRepositoryWrite;
}

export interface IUserService {
  createUser(params: IParamsCreateUser): Promise<IUser>;
  getUserById(id: string): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser>;
  updateUserById(id: string, params: IParamsUpdateUser): Promise<IUser>;
  deleteUserById(id: string): Promise<IUser>;
  listUsers(filter: Partial<IUser>): Promise<IUser[]>;
  updateSalary(userId: string, params: IUpdateSalaryInput): Promise<ISalary>;
  getAuthenticatedProfile(userId: string): Promise<Omit<IUser, 'passwordHash'>>;
}
