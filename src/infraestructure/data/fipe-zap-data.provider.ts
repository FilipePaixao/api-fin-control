import { readFileSync } from 'fs';
import path from 'path';
import {
  IFipeZapCityData,
  IFipeZapDataProvider,
} from '../../domain/regional-economics/interfaces/fipe-zap-data.provider.interface';

interface IFipeZapDataset {
  referencePeriod: string;
  nationalAverage: IFipeZapCityData;
  cities: IFipeZapCityData[];
  stateAverages: IFipeZapCityData[];
}

function normalizeCityName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export class FipeZapDataProvider implements IFipeZapDataProvider {
  private readonly dataset: IFipeZapDataset;

  constructor(datasetPath?: string) {
    const resolvedPath =
      datasetPath ??
      path.join(__dirname, 'regional', 'fipe-zap-rent-by-city.json');
    this.dataset = JSON.parse(readFileSync(resolvedPath, 'utf-8')) as IFipeZapDataset;
  }

  getReferencePeriod(): string {
    return this.dataset.referencePeriod;
  }

  findByCity(city: string, state: string): IFipeZapCityData | null {
    const normalizedCity = normalizeCityName(city);
    const normalizedState = state.trim().toUpperCase();

    return (
      this.dataset.cities.find(
        (entry) =>
          normalizeCityName(entry.city) === normalizedCity &&
          entry.state.toUpperCase() === normalizedState,
      ) ?? null
    );
  }

  findByState(state: string): IFipeZapCityData | null {
    const normalizedState = state.trim().toUpperCase();

    return (
      this.dataset.stateAverages.find(
        (entry) => entry.state.toUpperCase() === normalizedState,
      ) ?? null
    );
  }

  getNationalAverage(): IFipeZapCityData {
    return this.dataset.nationalAverage;
  }
}
