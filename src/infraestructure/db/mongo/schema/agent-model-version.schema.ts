import { Schema } from 'mongoose';
import { IMAgentModelVersion } from '../interfaces/agent-model-version.interface';

export const AgentModelVersionSchema = new Schema<IMAgentModelVersion>(
  {
    id: { type: String, required: true, unique: true },
    modelTag: { type: String, required: true },
    sampleCount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AgentModelVersionSchema.index({ createdAt: -1 });
