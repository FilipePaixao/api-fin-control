import { AddressService } from '../../domain/address/service/address.service';
import { ViaCepProvider } from '../../infraestructure/external/via-cep/via-cep.provider';

export class AddressServiceFactory {
  static create(): AddressService {
    return new AddressService({
      viaCepProvider: new ViaCepProvider(),
    });
  }
}
