import { IViaCepProvider } from '../../address/interfaces/via-cep.provider.interface';
import { ERegionalConfidence } from '../entity/enums/ERegionalConfidence';
import { ERegionalDataSource } from '../entity/enums/ERegionalDataSource';
import { ERegionalFallbackLevel } from '../entity/enums/ERegionalFallbackLevel';
import {
  IRegionalCostProfile,
  IRegionalEstimatedRent,
} from '../entity/interfaces/regional-cost-profile.interface';
import { IFipeZapDataProvider } from '../interfaces/fipe-zap-data.provider.interface';
import { IRegionalEconomicsService } from '../interfaces/regional-economics.service.interface';
import { IZonevalProvider } from '../interfaces/zoneval.provider.interface';
import { ELivingSituation } from '../../user/entity/enums/ELivingSituation';
import { IUser } from '../../user/entity/interfaces/user.interface';

const STUDIO_AREA_M2 = 35;
const ONE_BEDROOM_AREA_M2 = 50;
const TWO_BEDROOM_AREA_M2 = 70;

const HOUSING_SITUATION_FACTORS: Record<ELivingSituation, number> = {
  [ELivingSituation.WITH_PARENTS]: 0,
  [ELivingSituation.WITH_PARTNER]: 0.5,
  [ELivingSituation.WITH_ROOMMATES]: 0.4,
  [ELivingSituation.ALONE]: 1,
  [ELivingSituation.OTHER]: 1,
};

interface ICacheEntry {
  profile: IRegionalCostProfile;
  expiresAt: number;
}

interface IParamsRegionalEconomicsService {
  fipeZapDataProvider: IFipeZapDataProvider;
  viaCepProvider: IViaCepProvider;
  zonevalProvider?: IZonevalProvider;
  cacheTtlMs?: number;
}

export class RegionalEconomicsService implements IRegionalEconomicsService {
  private readonly fipeZapDataProvider: IFipeZapDataProvider;
  private readonly viaCepProvider: IViaCepProvider;
  private readonly zonevalProvider?: IZonevalProvider;
  private readonly cacheTtlMs: number;
  private readonly cache = new Map<string, ICacheEntry>();

  constructor({
    fipeZapDataProvider,
    viaCepProvider,
    zonevalProvider,
    cacheTtlMs = 24 * 60 * 60 * 1000,
  }: IParamsRegionalEconomicsService) {
    this.fipeZapDataProvider = fipeZapDataProvider;
    this.viaCepProvider = viaCepProvider;
    this.zonevalProvider = zonevalProvider;
    this.cacheTtlMs = cacheTtlMs;
  }

  async getRegionalCostProfile(user: IUser): Promise<IRegionalCostProfile | null> {
    const address = user.profile?.address;
    if (!address?.zipCode) {
      return null;
    }

    const normalizedZipCode = address.zipCode.replace(/\D/g, '');
    const cacheKey = `${user.id}:${normalizedZipCode}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.profile;
    }

    const location = await this.resolveLocation(address);
    if (!location) {
      return null;
    }

    const housingSituationFactor = this.resolveHousingSituationFactor(
      user.profile?.livingSituation,
    );

    const zonevalResult = this.zonevalProvider
      ? await this.zonevalProvider.lookupByZipCode(normalizedZipCode)
      : null;

    const fipeZapCityData =
      this.fipeZapDataProvider.findByCity(location.city, location.state) ??
      this.fipeZapDataProvider.findByState(location.state) ??
      this.fipeZapDataProvider.getNationalAverage();

    const rentPerM2Average = zonevalResult?.rentPerM2.average ?? fipeZapCityData.rentPerM2;
    const estimatedRent = this.buildEstimatedRent(rentPerM2Average);
    const adjustedEstimatedRent = this.applyHousingFactor(
      estimatedRent,
      housingSituationFactor,
    );

    const profile: IRegionalCostProfile = {
      zipCode: normalizedZipCode,
      neighborhood: location.neighborhood,
      city: location.city,
      state: location.state,
      dataSource: zonevalResult ? ERegionalDataSource.BLENDED : ERegionalDataSource.FIPE_ZAP,
      referencePeriod:
        zonevalResult?.referencePeriod ?? this.fipeZapDataProvider.getReferencePeriod(),
      rentPerM2: {
        average: rentPerM2Average,
        median: zonevalResult?.rentPerM2.median,
        support: zonevalResult?.rentPerM2.support,
      },
      estimatedRent,
      costOfLivingIndex: fipeZapCityData.costOfLivingIndex,
      costBreakdown: fipeZapCityData.costBreakdown,
      confidence: this.resolveConfidence(zonevalResult?.fallbackLevel, fipeZapCityData.city),
      fallbackLevel:
        zonevalResult?.fallbackLevel ??
        (fipeZapCityData.city === 'Brasil'
          ? ERegionalFallbackLevel.STATE
          : ERegionalFallbackLevel.CITY),
      housingSituationFactor,
      adjustedEstimatedRent,
    };

    this.cache.set(cacheKey, {
      profile,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return profile;
  }

  private async resolveLocation(address: {
    zipCode: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }): Promise<{ neighborhood: string; city: string; state: string } | null> {
    if (address.city && address.state) {
      return {
        neighborhood: address.neighborhood?.trim() ?? '',
        city: address.city.trim(),
        state: address.state.trim().toUpperCase(),
      };
    }

    const lookup = await this.viaCepProvider.lookupZipCode(address.zipCode);
    if (!lookup) {
      return null;
    }

    return {
      neighborhood: lookup.neighborhood,
      city: lookup.city,
      state: lookup.state,
    };
  }

  private resolveHousingSituationFactor(
    livingSituation?: ELivingSituation,
  ): number {
    if (!livingSituation) {
      return 1;
    }

    return HOUSING_SITUATION_FACTORS[livingSituation];
  }

  private buildEstimatedRent(rentPerM2: number): IRegionalEstimatedRent {
    return {
      studio: this.roundCurrency(rentPerM2 * STUDIO_AREA_M2),
      oneBedroom: this.roundCurrency(rentPerM2 * ONE_BEDROOM_AREA_M2),
      twoBedroom: this.roundCurrency(rentPerM2 * TWO_BEDROOM_AREA_M2),
    };
  }

  private applyHousingFactor(
    estimatedRent: IRegionalEstimatedRent,
    factor: number,
  ): IRegionalEstimatedRent {
    return {
      studio: this.roundCurrency(estimatedRent.studio * factor),
      oneBedroom: this.roundCurrency(estimatedRent.oneBedroom * factor),
      twoBedroom: this.roundCurrency(estimatedRent.twoBedroom * factor),
    };
  }

  private resolveConfidence(
    fallbackLevel?: ERegionalFallbackLevel,
    cityName?: string,
  ): ERegionalConfidence {
    if (fallbackLevel === ERegionalFallbackLevel.ZIPCODE) {
      return ERegionalConfidence.HIGH;
    }
    if (
      fallbackLevel === ERegionalFallbackLevel.NEIGHBORHOOD ||
      fallbackLevel === ERegionalFallbackLevel.CITY
    ) {
      return ERegionalConfidence.MEDIUM;
    }
    if (cityName === 'Brasil') {
      return ERegionalConfidence.LOW;
    }
    return ERegionalConfidence.MEDIUM;
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
