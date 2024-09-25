import { testDbConnect, testDbDisconnect } from './test.db';

process.env.NODE_ENV = 'test';

beforeAll(() => {
  return testDbConnect();
}, 70 * 1000);

afterAll(() => {
  return testDbDisconnect();
});
