import { dbConnect, dbDisconnect } from '../configs/db';
// import redisClient from '../configs/redis';

// beforeAll(() => Promise.all([dbConnect(), redisClient.connect()]), 70 * 1000);

// afterAll(() => Promise.all([dbDisconnect(), redisClient.disconnect()]));

beforeAll(dbConnect, 70 * 1000);

afterAll(dbDisconnect);
