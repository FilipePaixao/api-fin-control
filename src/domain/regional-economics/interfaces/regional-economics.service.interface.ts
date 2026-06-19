import { IUser } from '../../user/entity/interfaces/user.interface';
import { IRegionalCostProfile } from '../entity/interfaces/regional-cost-profile.interface';

export interface IRegionalEconomicsService {
  getRegionalCostProfile(user: IUser): Promise<IRegionalCostProfile | null>;
}
