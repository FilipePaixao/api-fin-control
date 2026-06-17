import { IThrowedError, serviceLogErrorHandler } from '@sauvvitech/st-packages';
import { EErrorCode } from '../../../domain/common/errors/enums/EErrorCode';
import { IAgentModelVersion } from '../../../domain/agent/entity/interfaces/agent-model-version.interface';
import { IAgentModelVersionRepositoryWrite } from '../../../domain/agent/repository/agent-model-version.repository';
import { AgentModelVersionModel } from '../../db/mongo/models/agent-model-version.model';
import { dbToInternal, internalToDb } from './adapters/agent-model-version.adapter';

export class AgentModelVersionRepositoryWrite implements IAgentModelVersionRepositoryWrite {
  async createModelVersion(version: IAgentModelVersion): Promise<IAgentModelVersion> {
    try {
      const createdVersion = await AgentModelVersionModel.create(internalToDb(version));
      return dbToInternal(createdVersion);
    } catch (error: any) {
      serviceLogErrorHandler(error, {
        eventName: 'AgentModelVersionRepositoryWrite.createModelVersion',
        eventData: { modelTag: version.modelTag },
      });
      throw {
        status: 500,
        errorCode: EErrorCode.DATABASE_ERROR,
      } as IThrowedError;
    }
  }
}
