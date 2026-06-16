import { Types } from 'mongoose';
import { IRefreshToken } from '../../../../domain/auth/entity/interfaces/refresh-token.interface';

export interface IMRefreshToken extends IRefreshToken {
  _id: Types.ObjectId;
}
