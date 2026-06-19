export interface ITrainingDatasetWriter {
  writeJsonLines(outputPath: string, lines: string[]): Promise<void>;
}
