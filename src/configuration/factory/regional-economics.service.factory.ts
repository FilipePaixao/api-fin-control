import {
  REGIONAL_CACHE_TTL_HOURS,
  ZONEVAL_API_KEY,
  ZONEVAL_API_SECRET,
  ZONEVAL_BASE_URL,
} from '../env-constants/env.constants';
import { RegionalEconomicsService } from '../../domain/regional-economics/service/regional-economics.service';
import { FipeZapDataProvider } from '../../infraestructure/data/fipe-zap-data.provider';
import { ViaCepProvider } from '../../infraestructure/external/via-cep/via-cep.provider';
import { ZonevalProvider } from '../../infraestructure/external/zoneval/zoneval.provider';

export class RegionalEconomicsServiceFactory {
  static create(): RegionalEconomicsService {
    const zonevalProvider =
      ZONEVAL_API_KEY && ZONEVAL_API_SECRET
        ? new ZonevalProvider({
            apiKey: ZONEVAL_API_KEY,
            apiSecret: ZONEVAL_API_SECRET,
            baseUrl: ZONEVAL_BASE_URL,
          })
        : undefined;

    return new RegionalEconomicsService({
      fipeZapDataProvider: new FipeZapDataProvider(),
      viaCepProvider: new ViaCepProvider(),
      zonevalProvider,
      cacheTtlMs: REGIONAL_CACHE_TTL_HOURS * 60 * 60 * 1000,
    });
  }
}
