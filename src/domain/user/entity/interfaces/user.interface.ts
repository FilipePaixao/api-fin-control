import { IDocument } from './document.interface';
import { ISalary } from './salary.interface';
import { IUserProfile } from './user-profile.interface';

export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  document?: IDocument;
  salary?: ISalary;
  age?: number;
  profile?: IUserProfile;
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
  profile?: IUserProfile;
  onboardingRequired?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
