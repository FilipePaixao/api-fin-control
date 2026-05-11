import { name, version } from '../../../package.json';
export const SERVICE_NAME = name;
export const SERVICE_VERSION = version;
export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';