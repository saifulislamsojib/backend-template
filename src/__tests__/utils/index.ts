import app from '@/app';
import supertest from 'supertest';
import { testDbConnect, testDbDisconnect } from './db.utils';

export const request = supertest(app);

export const apiUrl = '/api/v1';

beforeAll(() => {
  return testDbConnect();
});

afterAll(() => {
  return testDbDisconnect();
});

type ArrayOrObject = Record<string, unknown> | Array<unknown>;

type Matcher<T extends ArrayOrObject> = {
  status?: number;
  success?: boolean;
  data?: T;
  message?: string | RegExp;
  type?: string | RegExp;
};

type TesterProps<T extends ArrayOrObject> = {
  url: string;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  body?: Record<string, unknown>;
  expected?: Matcher<T>;
};

export const apiTester = async <T extends ArrayOrObject>({
  url,
  method = 'get',
  body: reqBody,
  expected: { status = 200, success = true, message, type, data } = {},
}: TesterProps<T>) => {
  const query = request[method](url);
  if (reqBody) {
    query.send(reqBody);
  }
  const res = await query;
  expect(res.status).toBe(status);
  expect(res.body?.success).toBe(success);
  if (data && Array.isArray(data)) {
    expect(res.body?.data).toStrictEqual(expect.arrayContaining(data));
  } else if (data && Object.keys(data).length) {
    expect(res.body?.data).toStrictEqual(expect.objectContaining(data));
  }
  if (message) {
    expect(res.body?.message).toMatch(message);
  }
  if (type) {
    expect(res.body?.type).toMatch(type);
  }

  return { body: res.body };
};

export const types = {
  string: expect.any(String),
  number: expect.any(String),
  boolean: expect.any(Boolean),
  array: expect.any(Array),
  object: expect.any(Object),
  date: expect.any(Date),
};
