import { Pool, QueryResult, QueryResultRow } from 'pg';
import { POSTGRES_URI } from '../../../configuration/env-constants/env.constants';

export const postgresPool = new Pool({
  connectionString: POSTGRES_URI,
});

export async function runPostgresQuery<T extends QueryResultRow = QueryResultRow>(
  query: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return postgresPool.query<T>(query, values);
}
