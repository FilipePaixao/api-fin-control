import { IAddressLookupResult } from '../../user/entity/interfaces/address.interface';
import { IViaCepProvider } from './via-cep.provider.interface';

export interface IParamsAddressService {
  viaCepProvider: IViaCepProvider;
}

export interface IAddressService {
  lookupZipCode(zipCode: string): Promise<IAddressLookupResult>;
}
