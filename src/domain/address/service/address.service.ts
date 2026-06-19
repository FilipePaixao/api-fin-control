import { IThrowedError } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../common/errors/enums/EErrorCode';
import { IAddressLookupResult } from '../../user/entity/interfaces/address.interface';
import {
  IAddressService,
  IParamsAddressService,
} from '../interfaces/address.service.interface';

const ZIP_CODE_REGEX = /^\d{8}$/;

export class AddressService implements IAddressService {
  private readonly viaCepProvider: IParamsAddressService['viaCepProvider'];

  constructor({ viaCepProvider }: IParamsAddressService) {
    this.viaCepProvider = viaCepProvider;
  }

  async lookupZipCode(zipCode: string): Promise<IAddressLookupResult> {
    const normalizedZipCode = zipCode.replace(/\D/g, '');
    if (!ZIP_CODE_REGEX.test(normalizedZipCode)) {
      throw {
        status: 400,
        errorCode: EErrorCode.ADDRESS_INVALID_ZIP_CODE,
        message: 'Invalid zip code',
      } as IThrowedError;
    }

    const lookupResult = await this.viaCepProvider.lookupZipCode(normalizedZipCode);
    if (!lookupResult) {
      throw {
        status: 404,
        errorCode: EErrorCode.RESOURCE_NOT_FOUND,
        message: 'Zip code not found',
      } as IThrowedError;
    }

    return lookupResult;
  }
}
