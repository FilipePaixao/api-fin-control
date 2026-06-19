import { IRegionalRentStats } from '../entity/interfaces/regional-cost-profile.interface';
import { ERegionalFallbackLevel } from '../entity/enums/ERegionalFallbackLevel';

export interface IZonevalStatsGroup {
  global?: IRegionalRentStats;
  perM2?: IRegionalRentStats;
}

export interface IZonevalLookupResult {
  fallbackLevel: ERegionalFallbackLevel;
  rentPerM2: IRegionalRentStats;
  referencePeriod: string;
}

export interface IZonevalProvider {
  lookupByZipCode(zipCode: string): Promise<IZonevalLookupResult | null>;
}
