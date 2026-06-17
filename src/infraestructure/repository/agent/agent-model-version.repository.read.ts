import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { IAgentModelVersion } from '../../../domain/agent/entity/interfaces/agent-model-version.interface';
import { IAgentModelVersionRepositoryRead } from '../../../domain/agent/repository/agent-model-version.repository';
import { AgentModelVersionModel } from '../../db/mongo/models/agent-model-version.model';
import { dbToInternal } from './adapters/agent-model-version.adapter';

export class AgentModelVersionRepositoryRead implements IAgentModelVersionRepositoryRead {
  async listModelVersions(limit = 20): Promise<IAgentModelVersion[]> {
    try {
      const versions = await AgentModelVersionModel.find().sort({ createdAt: -1 }).limit(limit);
      return versions.map(dbToInternal);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'AgentModelVersionRepositoryRead.listModelVersions',
        eventData: { limit },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
