import { name, version } from '../../../package.json';

export const SERVICE_NAME = name;
export const SERVICE_VERSION = version;
export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_TEST = NODE_ENV === 'test' || NODE_ENV === 'TEST';

export const DATABASE_URI = process.env.DATABASE_URI || '';
export const POSTGRES_URI = process.env.POSTGRES_URI || '';

export const JWT_SECRET = process.env.JWT_SECRET || '';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';
export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'mock';
export const EMBEDDING_VECTOR_SIZE =
  Number(process.env.EMBEDDING_VECTOR_SIZE) || 1536;
export const RUN_PG_INTEGRATION = process.env.RUN_PG_INTEGRATION === 'true';

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
export const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 60000;
