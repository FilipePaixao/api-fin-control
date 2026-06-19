import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { AddressService } from '../../../../domain/address/service/address.service';
import { IViaCepProvider } from '../../../../domain/address/interfaces/via-cep.provider.interface';

function createViaCepProviderMock(
  override: Partial<IViaCepProvider> = {},
): IViaCepProvider {
  return {
    lookupZipCode: jest.fn(),
    ...override,
  };
}

describe('When looking up an invalid zip code in AddressService', () => {
  it('Should reject with ADDRESS_INVALID_ZIP_CODE', async () => {
    const service = new AddressService({
      viaCepProvider: createViaCepProviderMock(),
    });

    await expect(service.lookupZipCode('123')).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.ADDRESS_INVALID_ZIP_CODE,
    });
  });
});

describe('When ViaCEP does not find a zip code in AddressService', () => {
  it('Should reject with RESOURCE_NOT_FOUND', async () => {
    const service = new AddressService({
      viaCepProvider: createViaCepProviderMock({
        lookupZipCode: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(service.lookupZipCode('00000000')).rejects.toMatchObject({
      status: 404,
      errorCode: EErrorCode.RESOURCE_NOT_FOUND,
    });
  });
});

describe('When ViaCEP returns a valid address in AddressService', () => {
  it('Should return normalized lookup result', async () => {
    const service = new AddressService({
      viaCepProvider: createViaCepProviderMock({
        lookupZipCode: jest.fn().mockResolvedValue({
          zipCode: '01310100',
          street: 'Avenida Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
        }),
      }),
    });

    const result = await service.lookupZipCode('01310-100');

    expect(result).toEqual({
      zipCode: '01310100',
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
  });
});
