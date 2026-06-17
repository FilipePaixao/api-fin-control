export interface IAgentModelVersion {
  id: string;
  modelTag: string;
  sampleCount: number;
  createdAt: Date;
}

export interface ICreateAgentModelVersionInput {
  modelTag: string;
  sampleCount: number;
}
