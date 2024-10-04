import { dbConnect, dbDisconnect } from '../configs/db';
import redisClient from '../configs/redis';

// set env for test
process.env.NODE_ENV = 'test';

beforeAll(() => Promise.all([dbConnect(), redisClient.connect()]), 70 * 1000);

afterAll(() => Promise.all([dbDisconnect(), redisClient.disconnect()]));
