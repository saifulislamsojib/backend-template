import redisClient from './redis';
import { testDbConnect, testDbDisconnect } from './test.db';

// set env for test
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.IS_LOGS_ON_FILE = 'false';

beforeAll(() => Promise.all([testDbConnect(), redisClient.connect()]), 70 * 1000);

afterAll(() => Promise.all([testDbDisconnect(), redisClient.disconnect()]));
