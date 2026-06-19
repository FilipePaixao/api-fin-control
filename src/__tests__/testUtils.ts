import { MongooseDatabase } from '../../jest/setup-db';

export async function bootstrapTest() {
  const DATABASE_URI = String(process.env.DATABASE_URI || '');
  const DB_NAME = String(process.env.DATABASE_NAME);
  const dbInstance = new MongooseDatabase(DATABASE_URI, DB_NAME);

  await dbInstance.start();

  const { app } = await import('./configApp');

  return {
    dbInstance,
    app,
  };
}
