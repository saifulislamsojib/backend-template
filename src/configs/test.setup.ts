import redisClient from './redis';
import { testDbConnect, testDbDisconnect } from './test.db';

// set env for test
process.env.NODE_ENV = 'test';

beforeAll(() => Promise.all([testDbConnect(), redisClient.connect()]), 70 * 10000);

afterAll(() => Promise.all([testDbDisconnect(), redisClient.disconnect()]));
