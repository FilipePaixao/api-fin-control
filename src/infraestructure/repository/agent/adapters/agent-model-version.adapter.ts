import { IAgentModelVersion } from '../../../../domain/agent/entity/interfaces/agent-model-version.interface';
import { IMAgentModelVersion } from '../../../db/mongo/interfaces/agent-model-version.interface';

export function dbToInternal(version: IMAgentModelVersion): IAgentModelVersion {
  return {
    id: version.id,
    modelTag: version.modelTag,
    sampleCount: version.sampleCount,
    createdAt: version.createdAt,
  };
}

export function internalToDb(
  version: IAgentModelVersion,
): Omit<IMAgentModelVersion, '_id' | 'createdAt'> {
  return {
    id: version.id,
    modelTag: version.modelTag,
    sampleCount: version.sampleCount,
  };
}
