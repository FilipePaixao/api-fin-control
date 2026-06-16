import { ECurrency } from '../enums/ECurrency';

export interface ISalary {
  amount: number;
  currency: ECurrency;
  paymentDay?: number;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}
