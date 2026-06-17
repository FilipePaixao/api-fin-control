import { model } from 'mongoose';
import { IMAgentModelVersion } from '../interfaces/agent-model-version.interface';
import { AgentModelVersionSchema } from '../schema/agent-model-version.schema';

export const AgentModelVersionModel = model<IMAgentModelVersion>(
  'AgentModelVersion',
  AgentModelVersionSchema,
);
