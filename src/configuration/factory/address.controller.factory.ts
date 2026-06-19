import { AddressController } from '../../application/controllers/address.controller';
import { createAuthenticateMiddleware } from '../../application/middleware/authenticate.middleware';
import { IController } from '../../domain/server/interfaces/IController';
import { JwtTokenProvider } from '../../infraestructure/security/jwt-token.provider';
import { AddressServiceFactory } from './address.service.factory';

export class AddressControllerFactory {
  static create(): IController {
    const authTokenProvider = new JwtTokenProvider();
    return new AddressController(
      AddressServiceFactory.create(),
      createAuthenticateMiddleware(authTokenProvider),
    );
  }
}
