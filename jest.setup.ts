import { testDbConnect, testDbDisconnect } from './src/configs/test.db';

process.env.NODE_ENV = 'test';

beforeAll(() => {
  return testDbConnect();
});

afterAll(() => {
  return testDbDisconnect();
});
