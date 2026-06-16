import { AuthService } from '../../domain/auth/service/auth.service';
import { UserRepositoryRead } from '../../infraestructure/repository/user/user.repository.read';
import { UserRepositoryWrite } from '../../infraestructure/repository/user/user.repository.write';
import { RefreshTokenRepositoryRead } from '../../infraestructure/repository/auth/refresh-token.repository.read';
import { RefreshTokenRepositoryWrite } from '../../infraestructure/repository/auth/refresh-token.repository.write';
import { BcryptPasswordHasher } from '../../infraestructure/security/bcrypt-password-hasher';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';

export class AuthServiceFactory {
  static create() {
    return new AuthService({
      userRepositoryRead: new UserRepositoryRead(),
      userRepositoryWrite: new UserRepositoryWrite(),
      refreshTokenRepositoryRead: new RefreshTokenRepositoryRead(),
      refreshTokenRepositoryWrite: new RefreshTokenRepositoryWrite(),
      passwordHasher: new BcryptPasswordHasher(),
      authTokenProvider: new JwtTokenProvider(),
    });
  }
}
