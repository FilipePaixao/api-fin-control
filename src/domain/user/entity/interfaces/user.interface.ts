import { IDocument } from './document.interface';
import { ISalary } from './salary.interface';

export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  document?: IDocument;
  salary?: ISalary;
  age?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IRegisterUserInput {
  name: string;
  email: string;
  password: string;
  document: IDocument;
  age?: number;
}

export interface IUserPublicProfile {
  id: string;
  name: string;
  email: string;
  document?: IDocument;
  salary?: ISalary;
  age?: number;
  createdAt: Date;
  updatedAt?: Date;
}
