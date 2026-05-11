import { IUser } from './interfaces/user.interface';

export class UserServiceEntity implements IUser {
  id: string;

  name: string;

  email: string;

  createdAt: Date;

  constructor(user: IUser) {
    this.validateUser(user);
    this.id = user.id 
    this.name = user.name;
    this.email = user.email;
    this.createdAt = user.createdAt || new Date();
  }

  private validateUser(user: IUser): void {
    if (!user.name?.trim()) {
      throw new Error('Name is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email?.trim() || !emailRegex.test(user.email)) {
      throw new Error('Please provide a valid email address');
    }
  }
}
