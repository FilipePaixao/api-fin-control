import { promises as fs } from 'fs';
import path from 'path';
import { ITrainingDatasetWriter } from '../../domain/agent/interfaces/training-dataset-writer.interface';

export class FsTrainingDatasetWriter implements ITrainingDatasetWriter {
  async writeJsonLines(outputPath: string, lines: string[]): Promise<void> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
  }
}
