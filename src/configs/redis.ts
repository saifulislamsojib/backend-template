import { createClient } from 'redis';
import env from './env';
import logger from './logger';

const { REDIS_HOST, REDIS_PORT } = env;

const client = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

client.on('error', (err) => {
  logger.warn({ ...err }, 'Redis client connection error');
});

client.on('connect', () => logger.info('Redis Client successfully connected!'));

if (env.NODE_ENV !== 'test') {
  void client.connect();
}

export default client;
