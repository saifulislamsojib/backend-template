import app from '@/app';
import supertest from 'supertest';

export const request = supertest(app);

type Matcher = {
  status?: number;
  success?: boolean;
  type?: string | RegExp;
};

type TesterProps = {
  url: string;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  body?: Record<string, unknown>;
  expected?: Matcher;
  token?: string;
};

const apiTester = async ({
  url,
  method = 'get',
  body: reqBody,
  expected: { status = 200, success = true, type } = {},
  token,
}: TesterProps) => {
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
  if (type) {
    expect(res.body?.type).toMatch(type);
  }

  return res.body;
};

export default apiTester;
