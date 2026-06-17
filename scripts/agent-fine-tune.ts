import '../src/configuration/dotenv';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import mongoose from 'mongoose';
import {
  AGENT_FINE_TUNE_ENABLED,
  AGENT_FINE_TUNE_MODEL_TAG,
  DATABASE_URI,
  OLLAMA_BASE_URL,
} from '../src/configuration/env-constants/env.constants';

async function main(): Promise<void> {
  if (!AGENT_FINE_TUNE_ENABLED) {
    console.log('AGENT_FINE_TUNE_ENABLED=false — set to true to run fine-tune pipeline.');
    process.exit(0);
  }

  if (!DATABASE_URI) {
    throw new Error('DATABASE_URI is required');
  }

  await mongoose.connect(DATABASE_URI);

  const exportScript = path.resolve(__dirname, 'agent-export-training-data.ts');
  execSync(`npx ts-node --transpile-only "${exportScript}"`, {
    stdio: 'inherit',
    env: process.env,
  });

  const datasetPath = path.resolve(process.cwd(), 'data/training/exports/agent-dataset.jsonl');
  const modelfileContent = `FROM llama3.2
PARAMETER temperature 0.7
SYSTEM Você é o assistente do FinControl, um app de controle financeiro pessoal. Responda em português brasileiro.
`;

  const modelfilePath = path.resolve(process.cwd(), 'data/training/Modelfile');
  await fs.mkdir(path.dirname(modelfilePath), { recursive: true });
  await fs.writeFile(modelfilePath, modelfileContent);

  console.log('\nDataset pronto em:', datasetPath);
  console.log('Modelfile gerado em:', modelfilePath);
  console.log('\nPróximo passo (offline, requer Ollama):');
  console.log(`  ollama create ${AGENT_FINE_TUNE_MODEL_TAG} -f ${modelfilePath}`);
  console.log(`  # Após fine-tune externo com ${datasetPath}, aponte OLLAMA_MODEL=${AGENT_FINE_TUNE_MODEL_TAG}`);
  console.log(`  # Ollama base URL: ${OLLAMA_BASE_URL}`);
}

main()
  .catch((error) => {
    console.error('Fine-tune pipeline failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
