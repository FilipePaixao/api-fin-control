export interface IAgentTrainingExportService {
  exportAnonymizedDataset(outputPath: string): Promise<{ sampleCount: number }>;
}
