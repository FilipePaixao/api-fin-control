import { validateEnv } from '../../../configuration/env-constants/validate-env';
import {
  DATABASE_URI,
  IS_TEST,
  JWT_SECRET,
} from '../../../configuration/env-constants/env.constants';

describe('when validating environment configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should skip validation in test environment', () => {
    process.env.NODE_ENV = 'test';
    expect(() => validateEnv()).not.toThrow();
  });

  it('should throw when required variables are missing in non-test env', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URI = '';
    process.env.JWT_SECRET = '';
    process.env.JWT_REFRESH_SECRET = '';

    expect(() => validateEnv()).toThrow(/Missing required environment variables/);
  });

  it('should throw when JWT secrets are too short', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'short';
    process.env.JWT_REFRESH_SECRET = 'short';

    expect(() => validateEnv()).toThrow(/JWT_SECRET must be at least 32 characters/);
  });

  it('should pass when all required variables are valid', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'valid-access-secret-minimum-32-characters';
    process.env.JWT_REFRESH_SECRET = 'valid-refresh-secret-minimum-32-chars';

    expect(() => validateEnv()).not.toThrow();
  });

  it('should expose IS_TEST flag for test runs', () => {
    process.env.NODE_ENV = 'TEST';
    expect(IS_TEST).toBe(true);
    expect(DATABASE_URI).toBeDefined();
    expect(JWT_SECRET).toBeDefined();
  });
});
