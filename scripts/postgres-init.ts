import '../src/configuration/dotenv';
import { postgresSetup } from '../src/infraestructure/db/postgres/postgres.setup';
import { postgresPool } from '../src/infraestructure/db/postgres/postgres.client';

async function main(): Promise<void> {
  await postgresSetup();
  console.log('Postgres init scripts applied successfully.');
}

main()
  .catch((error) => {
    console.error('Postgres init failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await postgresPool.end();
  });
