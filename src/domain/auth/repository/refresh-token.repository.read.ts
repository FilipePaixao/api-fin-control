import { IRefreshToken } from '../entity/interfaces/refresh-token.interface';

export interface IRefreshTokenRepositoryRead {
  findByTokenHash(tokenHash: string): Promise<IRefreshToken | null>;
}
