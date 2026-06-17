import { Types } from 'mongoose';
import { IAgentModelVersion } from '../../../../domain/agent/entity/interfaces/agent-model-version.interface';

export interface IMAgentModelVersion extends IAgentModelVersion {
  _id: Types.ObjectId;
}
