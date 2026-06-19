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
  Number(process.env.EMBEDDING_VECTOR_SIZE) || 768;
export const RUN_PG_INTEGRATION = process.env.RUN_PG_INTEGRATION === 'true';

export const OPENSEARCH_URL = process.env.OPENSEARCH_URL || 'http://localhost:9200';
export const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'expenses';
export const OPENSEARCH_REFRESH_ON_WRITE =
  process.env.OPENSEARCH_REFRESH_ON_WRITE === 'true';

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
export const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 60000;
export const OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 32768;
export const OLLAMA_EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

export const AGENT_FINE_TUNE_ENABLED = process.env.AGENT_FINE_TUNE_ENABLED === 'true';
export const AGENT_FINE_TUNE_MODEL_TAG =
  process.env.AGENT_FINE_TUNE_MODEL_TAG || 'fincontrol-agent';
export const AGENT_FINE_TUNE_MIN_SAMPLES =
  Number(process.env.AGENT_FINE_TUNE_MIN_SAMPLES) || 500;

export const ZONEVAL_API_KEY = process.env.ZONEVAL_API_KEY || '';
export const ZONEVAL_API_SECRET = process.env.ZONEVAL_API_SECRET || '';
export const ZONEVAL_BASE_URL =
  process.env.ZONEVAL_BASE_URL || 'https://api.zoneval.com';
export const REGIONAL_CACHE_TTL_HOURS =
  Number(process.env.REGIONAL_CACHE_TTL_HOURS) || 168;
