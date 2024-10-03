import { createClient } from 'redis';
import configs from '.';
import logger from './logger';

const client = createClient({ url: configs.redis_url });

client.on('error', (err: Error) =>
  logger.fatal({ errorMsg: err.message }, 'Redis Client connection Error'),
);
client.on('connect', () => logger.info('Redis Client successfully connected!'));

export default client;
