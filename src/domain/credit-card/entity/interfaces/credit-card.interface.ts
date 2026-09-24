export interface ICreditCard {
  id: string;
  userId: string;
  name: string;
  lastFourDigits?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateCreditCardInput {
  userId: string;
  name: string;
  lastFourDigits?: string;
}

export interface IUpdateCreditCardInput {
  name?: string;
  lastFourDigits?: string | null;
}
