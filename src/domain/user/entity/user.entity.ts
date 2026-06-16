import { Types } from 'mongoose';
import { EDocumentType } from './enums/EDocumentType';
import { ECurrency } from './enums/ECurrency';
import { IDocument } from './interfaces/document.interface';
import { ISalary } from './interfaces/salary.interface';
import {
  IRegisterUserInput,
  IUser,
} from './interfaces/user.interface';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CPF_REGEX = /^\d{11}$/;
const CNPJ_REGEX = /^\d{14}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

export class UserServiceEntity implements IUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  document?: IDocument;
  salary?: ISalary;
  age?: number;
  createdAt: Date;
  updatedAt?: Date;

  constructor(user: IUser) {
    this.validateUser(user);
    this.id = user.id || new Types.ObjectId().toHexString();
    this.name = user.name.trim();
    this.email = user.email.trim().toLowerCase();
    this.passwordHash = user.passwordHash;
    this.document = user.document;
    this.salary = user.salary;
    this.age = user.age;
    this.createdAt = user.createdAt || new Date();
    this.updatedAt = user.updatedAt;
  }

  private validateUser(user: IUser): void {
    if (!user.name?.trim()) {
      throw new Error('Name is required');
    }
    if (!user.email?.trim() || !EMAIL_REGEX.test(user.email)) {
      throw new Error('Please provide a valid email address');
    }
    if (user.document) {
      this.validateDocument(user.document);
    }
    if (user.age !== undefined && (user.age < 0 || user.age > 150)) {
      throw new Error('Age must be between 0 and 150');
    }
    if (user.salary) {
      this.validateSalary(user.salary);
    }
  }

  static validateDocument(document: IDocument): void {
    if (!Object.values(EDocumentType).includes(document.type)) {
      throw new Error('Invalid document type');
    }
    if (!document.value?.trim()) {
      throw new Error('Document value is required');
    }
    if (document.type === EDocumentType.CPF && !CPF_REGEX.test(document.value)) {
      throw new Error('CPF must contain 11 digits');
    }
    if (
      document.type === EDocumentType.CNPJ &&
      !CNPJ_REGEX.test(document.value)
    ) {
      throw new Error('CNPJ must contain 14 digits');
    }
  }

  static validateSalary(salary: ISalary): void {
    if (!Object.values(ECurrency).includes(salary.currency)) {
      throw new Error('Invalid currency');
    }
    if (salary.amount <= 0) {
      throw new Error('Salary amount must be greater than zero');
    }
    if (
      salary.paymentDay !== undefined &&
      (salary.paymentDay < 1 || salary.paymentDay > 31)
    ) {
      throw new Error('Payment day must be between 1 and 31');
    }
  }

  private validateDocument(document: IDocument): void {
    UserServiceEntity.validateDocument(document);
  }

  private validateSalary(salary: ISalary): void {
    UserServiceEntity.validateSalary(salary);
  }
}

export class RegisterUserServiceEntity implements IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  document: IDocument;
  age?: number;
  createdAt: Date;
  updatedAt?: Date;

  constructor(input: IRegisterUserInput & { passwordHash: string; id?: string }) {
    RegisterUserServiceEntity.validateRegisterInput(input);
    this.id = input.id || new Types.ObjectId().toHexString();
    this.name = input.name.trim();
    this.email = input.email.trim().toLowerCase();
    this.passwordHash = input.passwordHash;
    this.document = input.document;
    this.age = input.age;
    this.createdAt = new Date();
  }

  static validateRegisterInput(input: IRegisterUserInput): void {
    if (!input.name?.trim()) {
      throw new Error('Name is required');
    }
    if (!input.email?.trim() || !EMAIL_REGEX.test(input.email)) {
      throw new Error('Please provide a valid email address');
    }
    if (!input.password || !PASSWORD_REGEX.test(input.password)) {
      throw new Error(
        'Password must be at least 8 characters with uppercase, lowercase and number',
      );
    }
    UserServiceEntity.validateDocument(input.document);
    if (input.age !== undefined && (input.age < 0 || input.age > 150)) {
      throw new Error('Age must be between 0 and 150');
    }
  }
}

export function toUserPublicProfile(user: IUser): Omit<IUser, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...publicProfile } = user;
  return publicProfile;
}
