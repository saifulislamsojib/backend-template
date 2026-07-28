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

client.on('error', (err: Error) => {
  logger.fatal({ errorMsg: err.message }, 'Redis Client connection Error');
});

client.on('connect', () => logger.info('Redis Client successfully connected!'));

export default client;
