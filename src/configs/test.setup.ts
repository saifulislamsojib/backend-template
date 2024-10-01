import { testDbConnect, testDbDisconnect } from './test.db';

process.env.NODE_ENV = 'test';

beforeAll(testDbConnect, 70 * 1000);

afterAll(testDbDisconnect);
