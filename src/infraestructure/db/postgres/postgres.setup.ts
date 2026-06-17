import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from 'traceability';
import { IS_TEST, POSTGRES_URI } from '../../../configuration/env-constants/env.constants';
import { runPostgresQuery } from './postgres.client';

export async function postgresSetup(): Promise<void> {
  if (IS_TEST || !POSTGRES_URI.trim()) {
    return;
  }

  const initDir = path.resolve(__dirname, 'init');
  const migrationFiles = (await fs.readdir(initDir))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  for (const fileName of migrationFiles) {
    const sql = await fs.readFile(path.join(initDir, fileName), 'utf8');
    await runPostgresQuery(sql);
    Logger.info(`Postgres schema applied: ${fileName}`, {
      eventName: 'postgres_setup',
    });
  }
}
