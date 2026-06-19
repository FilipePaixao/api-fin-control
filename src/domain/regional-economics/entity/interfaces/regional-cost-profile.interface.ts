import { ERegionalConfidence } from '../enums/ERegionalConfidence';
import { ERegionalDataSource } from '../enums/ERegionalDataSource';
import { ERegionalFallbackLevel } from '../enums/ERegionalFallbackLevel';

export interface IRegionalRentStats {
  average: number;
  median?: number;
  support?: number;
}

export interface IRegionalEstimatedRent {
  studio: number;
  oneBedroom: number;
  twoBedroom: number;
}

export interface IRegionalCostBreakdown {
  housing: number;
  food: number;
  transport: number;
}

export interface IRegionalCostProfile {
  zipCode: string;
  neighborhood: string;
  city: string;
  state: string;
  dataSource: ERegionalDataSource;
  referencePeriod: string;
  rentPerM2: IRegionalRentStats;
  estimatedRent: IRegionalEstimatedRent;
  costOfLivingIndex: number;
  costBreakdown: IRegionalCostBreakdown;
  confidence: ERegionalConfidence;
  fallbackLevel: ERegionalFallbackLevel;
  housingSituationFactor: number;
  adjustedEstimatedRent: IRegionalEstimatedRent;
}
