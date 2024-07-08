import { testDbConnect, testDbDisconnect } from './utils/db.utils';

process.env.NODE_ENV = 'test';

beforeAll(() => {
  return testDbConnect();
});

afterAll(() => {
  return testDbDisconnect();
});
