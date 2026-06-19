import {
  IZonevalLookupResult,
  IZonevalProvider,
  IZonevalStatsGroup,
} from '../../../domain/regional-economics/interfaces/zoneval.provider.interface';
import { ERegionalFallbackLevel } from '../../../domain/regional-economics/entity/enums/ERegionalFallbackLevel';

const DEFAULT_BASE_URL = 'https://api.zoneval.com';
const DEFAULT_TIMEOUT_MS = 8000;

interface ZonevalApiResponse {
  by_zipcode?: IZonevalStatsGroup;
  by_neighbourhood?: IZonevalStatsGroup;
  by_city?: IZonevalStatsGroup;
  by_uf?: IZonevalStatsGroup;
}

interface IParamsZonevalProvider {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  timeoutMs?: number;
  referencePeriod?: string;
}

export class ZonevalProvider implements IZonevalProvider {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly referencePeriod: string;

  constructor({
    apiKey,
    apiSecret,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    referencePeriod,
  }: IParamsZonevalProvider) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.referencePeriod = referencePeriod ?? this.buildCurrentReferencePeriod();
  }

  async lookupByZipCode(zipCode: string): Promise<IZonevalLookupResult | null> {
    const normalizedZipCode = zipCode.replace(/\D/g, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(
        `${this.baseUrl}/zipcodes/${normalizedZipCode}/stats/${this.referencePeriod}`,
        {
          signal: controller.signal,
          headers: {
            'x-api-key': this.apiKey,
            'x-api-secret': this.apiSecret,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as ZonevalApiResponse;
      return this.parseResponse(data);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseResponse(data: ZonevalApiResponse): IZonevalLookupResult | null {
    const candidates: Array<{
      fallbackLevel: ERegionalFallbackLevel;
      group?: IZonevalStatsGroup;
    }> = [
      { fallbackLevel: ERegionalFallbackLevel.ZIPCODE, group: data.by_zipcode },
      {
        fallbackLevel: ERegionalFallbackLevel.NEIGHBORHOOD,
        group: data.by_neighbourhood,
      },
      { fallbackLevel: ERegionalFallbackLevel.CITY, group: data.by_city },
      { fallbackLevel: ERegionalFallbackLevel.STATE, group: data.by_uf },
    ];

    for (const candidate of candidates) {
      const rentPerM2 = this.extractRentPerM2(candidate.group);
      if (rentPerM2) {
        return {
          fallbackLevel: candidate.fallbackLevel,
          rentPerM2,
          referencePeriod: this.referencePeriod,
        };
      }
    }

    return null;
  }

  private extractRentPerM2(
    group?: IZonevalStatsGroup,
  ): IZonevalLookupResult['rentPerM2'] | null {
    const perM2 = group?.perM2;
    if (!perM2?.average || perM2.average <= 0) {
      return null;
    }

    return {
      average: perM2.average,
      median: perM2.median,
      support: perM2.support,
    };
  }

  private buildCurrentReferencePeriod(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  }
}
