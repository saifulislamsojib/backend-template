import app from '@/app';
import supertest from 'supertest';

export const request = supertest(app);

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
  token?: string;
};

const apiTester = async <T extends ArrayOrObject>({
  url,
  method = 'get',
  body: reqBody,
  expected: { status = 200, success = true, message, type, data } = {},
  token,
}: TesterProps<T>) => {
  const query = request[method](url);
  if (reqBody) {
    query.send(reqBody);
  }
  if (token) {
    query.set('authorization', token);
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

export default apiTester;
