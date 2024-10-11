import { createClient } from 'redis';
import configs from '.';
import logger from './logger';

const { redis_host, redis_port } = configs;

const client = createClient({
  socket: {
    host: redis_host,
    port: redis_port,
  },
});

client.on('error', (err: Error) => {
  logger.fatal({ errorMsg: err.message }, 'Redis Client connection Error');
});

client.on('connect', () => logger.info('Redis Client successfully connected!'));

export default client;
