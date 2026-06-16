export function validateEnv(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'test' || nodeEnv === 'TEST') {
    return;
  }

  const databaseUri = process.env.DATABASE_URI || '';
  const jwtSecret = process.env.JWT_SECRET || '';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';
  const postgresUri = process.env.POSTGRES_URI || '';

  const missing: string[] = [];
  if (!databaseUri.trim()) missing.push('DATABASE_URI');
  if (!jwtSecret.trim()) missing.push('JWT_SECRET');
  if (!jwtRefreshSecret.trim()) missing.push('JWT_REFRESH_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  if (jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
  }

  if (!postgresUri.trim()) {
    console.warn(
      'POSTGRES_URI is not set — RAG/vector features will be unavailable',
    );
  }
}
