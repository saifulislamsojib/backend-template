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
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
} as const;

export default configs;
