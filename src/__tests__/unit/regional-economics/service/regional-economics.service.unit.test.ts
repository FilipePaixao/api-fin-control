import { ERegionalConfidence } from '../../../../domain/regional-economics/entity/enums/ERegionalConfidence';
import { ERegionalDataSource } from '../../../../domain/regional-economics/entity/enums/ERegionalDataSource';
import { ERegionalFallbackLevel } from '../../../../domain/regional-economics/entity/enums/ERegionalFallbackLevel';
import { RegionalEconomicsService } from '../../../../domain/regional-economics/service/regional-economics.service';
import { ELivingSituation } from '../../../../domain/user/entity/enums/ELivingSituation';
import { IFipeZapDataProvider } from '../../../../domain/regional-economics/interfaces/fipe-zap-data.provider.interface';
import { IViaCepProvider } from '../../../../domain/address/interfaces/via-cep.provider.interface';
import { IZonevalProvider } from '../../../../domain/regional-economics/interfaces/zoneval.provider.interface';

const SAO_PAULO_DATA = {
  city: 'São Paulo',
  state: 'SP',
  rentPerM2: 63.63,
  costOfLivingIndex: 142,
  costBreakdown: { housing: 1.42, food: 1.18, transport: 1.25 },
};

function createFipeZapProviderMock(
  override: Partial<IFipeZapDataProvider> = {},
): IFipeZapDataProvider {
  return {
    getReferencePeriod: jest.fn().mockReturnValue('2026-03'),
    findByCity: jest.fn().mockReturnValue(SAO_PAULO_DATA),
    findByState: jest.fn(),
    getNationalAverage: jest.fn().mockReturnValue({
      city: 'Brasil',
      state: 'BR',
      rentPerM2: 52.34,
      costOfLivingIndex: 100,
      costBreakdown: { housing: 1, food: 1, transport: 1 },
    }),
    ...override,
  };
}

function createViaCepProviderMock(
  override: Partial<IViaCepProvider> = {},
): IViaCepProvider {
  return {
    lookupZipCode: jest.fn(),
    ...override,
  };
}

describe('When resolving regional cost profile', () => {
  it('Should return null when user has no zip code', async () => {
    const service = new RegionalEconomicsService({
      fipeZapDataProvider: createFipeZapProviderMock(),
      viaCepProvider: createViaCepProviderMock(),
    });

    const result = await service.getRegionalCostProfile({
      id: 'user-1',
      name: 'Test',
      email: 'test@email.com',
      createdAt: new Date(),
      profile: { occupationArea: 'TI' },
    });

    expect(result).toBeNull();
  });

  it('Should build profile from FIPE/ZAP when Zoneval is unavailable', async () => {
    const service = new RegionalEconomicsService({
      fipeZapDataProvider: createFipeZapProviderMock(),
      viaCepProvider: createViaCepProviderMock(),
    });

    const result = await service.getRegionalCostProfile({
      id: 'user-1',
      name: 'Test',
      email: 'test@email.com',
      createdAt: new Date(),
      profile: {
        livingSituation: ELivingSituation.ALONE,
        address: {
          zipCode: '01310100',
          street: 'Av Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          number: '100',
        },
      },
    });

    expect(result).toMatchObject({
      zipCode: '01310100',
      city: 'São Paulo',
      state: 'SP',
      dataSource: ERegionalDataSource.FIPE_ZAP,
      rentPerM2: { average: 63.63 },
      costOfLivingIndex: 142,
      confidence: ERegionalConfidence.MEDIUM,
      fallbackLevel: ERegionalFallbackLevel.CITY,
      housingSituationFactor: 1,
      estimatedRent: {
        studio: 2227.05,
        oneBedroom: 3181.5,
        twoBedroom: 4454.1,
      },
    });
  });

  it('Should apply housing situation factor for users living with parents', async () => {
    const service = new RegionalEconomicsService({
      fipeZapDataProvider: createFipeZapProviderMock(),
      viaCepProvider: createViaCepProviderMock(),
    });

    const result = await service.getRegionalCostProfile({
      id: 'user-1',
      name: 'Test',
      email: 'test@email.com',
      createdAt: new Date(),
      profile: {
        livingSituation: ELivingSituation.WITH_PARENTS,
        address: {
          zipCode: '01310100',
          street: 'Av Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          number: '100',
        },
      },
    });

    expect(result?.housingSituationFactor).toBe(0);
    expect(result?.adjustedEstimatedRent.oneBedroom).toBe(0);
  });

  it('Should prefer Zoneval rent data when provider is configured', async () => {
    const zonevalProvider: IZonevalProvider = {
      lookupByZipCode: jest.fn().mockResolvedValue({
        fallbackLevel: ERegionalFallbackLevel.NEIGHBORHOOD,
        rentPerM2: { average: 70, median: 68, support: 120 },
        referencePeriod: '202603',
      }),
    };

    const service = new RegionalEconomicsService({
      fipeZapDataProvider: createFipeZapProviderMock(),
      viaCepProvider: createViaCepProviderMock(),
      zonevalProvider,
    });

    const result = await service.getRegionalCostProfile({
      id: 'user-1',
      name: 'Test',
      email: 'test@email.com',
      createdAt: new Date(),
      profile: {
        livingSituation: ELivingSituation.WITH_PARTNER,
        address: {
          zipCode: '01310100',
          street: 'Av Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          number: '100',
        },
      },
    });

    expect(zonevalProvider.lookupByZipCode).toHaveBeenCalledWith('01310100');
    expect(result).toMatchObject({
      dataSource: ERegionalDataSource.BLENDED,
      rentPerM2: { average: 70, median: 68, support: 120 },
      fallbackLevel: ERegionalFallbackLevel.NEIGHBORHOOD,
      confidence: ERegionalConfidence.MEDIUM,
      housingSituationFactor: 0.5,
      adjustedEstimatedRent: {
        oneBedroom: 1750,
      },
    });
  });
});
