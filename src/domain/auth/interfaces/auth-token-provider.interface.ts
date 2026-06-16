export interface IAccessTokenPayload {
  sub: string;
}

export interface IGeneratedAccessToken {
  token: string;
  expiresIn: number;
}

export interface IAuthTokenProvider {
  generateAccessToken(userId: string): IGeneratedAccessToken;
  verifyAccessToken(token: string): IAccessTokenPayload;
  generateRefreshTokenValue(): string;
  getRefreshTokenExpiresAt(): Date;
}
