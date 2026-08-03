import { envValidationSchema } from './env';

const validEnvironment = {
  APP_KEY: 'test-app-key',
  BCRYPT_SALT_ROUNDS: '10',
  CLIENT_ORIGIN: 'http://localhost:3000',
  DB_URI: 'mongodb://127.0.0.1:27017/backend-template-test',
  JWT_ACCESS_SECRET: 'test-jwt-access-secret',
};

describe('environment validation', () => {
  it('parses required values and applies typed defaults', () => {
    expect(envValidationSchema.parse(validEnvironment)).toMatchObject({
      ...validEnvironment,
      BCRYPT_SALT_ROUNDS: 10,
      JWT_ACCESS_EXPIRES_IN_MINUTES: 10080,
      NODE_ENV: 'development',
      PORT: 8080,
      REDIS_CACHE_REVALIDATE_TIME_IN_SECONDS: 86400,
      REDIS_PORT: 6379,
    });
  });

  it('rejects incomplete or invalid environment values', () => {
    expect(
      envValidationSchema.safeParse({ ...validEnvironment, CLIENT_ORIGIN: 'not-a-url' }).success,
    ).toBe(false);
    expect(envValidationSchema.safeParse({ ...validEnvironment, APP_KEY: 'short' }).success).toBe(
      false,
    );
  });
});
