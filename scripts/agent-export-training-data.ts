import '../src/configuration/dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { DATABASE_URI } from '../src/configuration/env-constants/env.constants';
import { AgentTrainingExportServiceFactory } from '../src/configuration/factory/agent-knowledge.service.factory';

async function main(): Promise<void> {
  if (!DATABASE_URI) {
    throw new Error('DATABASE_URI is required');
  }

  await mongoose.connect(DATABASE_URI);

  const outputPath =
    process.argv[2] ||
    path.resolve(process.cwd(), 'data/training/exports/agent-dataset.jsonl');

  const exportService = AgentTrainingExportServiceFactory.create();
  const result = await exportService.exportAnonymizedDataset(outputPath);

  console.log(`Exported ${result.sampleCount} anonymized samples to ${outputPath}`);
}

main()
  .catch((error) => {
    console.error('Export failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
