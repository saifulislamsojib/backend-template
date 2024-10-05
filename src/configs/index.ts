import env from 'dotenv';

// env config
env.config();

const configs = {
  port: process.env.PORT || 8080,
  origin: process.env.CLIENT_ORIGIN || '*',
  db_url: process.env.DB_URI,
  node_env: process.env.NODE_ENV,
  bcrypt_salt_rounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10),
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  log_level: process.env.LOG_LEVEL,
  is_logs_on_file: process.env.IS_LOGS_ON_FILE === 'true',
  api_route: '/api/v1',
  redis_host: process.env.REDIS_HOST || 'localhost',
  redis_port: parseInt(process.env.REDIS_PORT || '6379', 10),
  // time in seconds
  cache_revalidate_time: 60 * 60 * 24,
} as const;

Object.freeze(configs);

export default configs;
