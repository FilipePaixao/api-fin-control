import { IRefreshToken } from '../entity/interfaces/refresh-token.interface';

export interface IRefreshTokenRepositoryWrite {
  createRefreshToken(refreshToken: IRefreshToken): Promise<IRefreshToken>;
  revokeById(id: string): Promise<void>;
}
