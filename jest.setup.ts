import { testDbConnect, testDbDisconnect } from './src/__tests__/utils/test.db';

process.env.NODE_ENV = 'test';

beforeAll(() => {
  return testDbConnect();
});

afterAll(() => {
  return testDbDisconnect();
});
