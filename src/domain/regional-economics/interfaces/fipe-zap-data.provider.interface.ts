export interface IFipeZapCityData {
  city: string;
  state: string;
  rentPerM2: number;
  costOfLivingIndex: number;
  costBreakdown: {
    housing: number;
    food: number;
    transport: number;
  };
}

export interface IFipeZapDataProvider {
  getReferencePeriod(): string;
  findByCity(city: string, state: string): IFipeZapCityData | null;
  findByState(state: string): IFipeZapCityData | null;
  getNationalAverage(): IFipeZapCityData;
}
