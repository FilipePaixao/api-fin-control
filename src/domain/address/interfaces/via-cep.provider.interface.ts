import { IAddressLookupResult } from '../../user/entity/interfaces/address.interface';

export interface IViaCepProvider {
  lookupZipCode(zipCode: string): Promise<IAddressLookupResult | null>;
}
