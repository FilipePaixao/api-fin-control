import { IAgentModelVersion } from '../entity/interfaces/agent-model-version.interface';

export interface IAgentModelVersionRepositoryWrite {
  createModelVersion(version: IAgentModelVersion): Promise<IAgentModelVersion>;
}

export interface IAgentModelVersionRepositoryRead {
  listModelVersions(limit?: number): Promise<IAgentModelVersion[]>;
}
