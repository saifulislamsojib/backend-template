import app from '@/app.js';
import status from 'http-status';
import supertest from 'supertest';
import type { TResponse } from '../utils/sendResponse.ts';

export const request = supertest(app);

type Matcher = {
  status?: number;
  success?: boolean;
  type?: string | RegExp;
};

type TesterProps = {
  url: string;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  body?: AnyObject;
  expected?: Matcher;
  token?: string;
};

type Response = TResponse<AnyObject, AnyObject>;

/**
 * A helper function to test API endpoints.
 *
 * @param {TesterProps} testerOptions an object with the following properties: --
 * - `url`: the URL of the API endpoint to test.
 * - `method`: the HTTP method to use. Defaults to `'get'`.
 * - `body`: an object to send in the request body.
 * - `expected`: an object with the following properties: --
 *    - - `status`: the expected HTTP status code. Defaults to `200`.
 *    - - `success`: the expected value of `res.body.success`. Defaults to `true`.
 *    - - `type`: the expected value of `res.body.type` if success false. Optional.
 * - `token`: the value of the `authorization` header to set. Optional.
 *
 * @returns a promise that resolves to the response body
 */
const apiTester = async <T extends Response = Response>(testerOptions: TesterProps) => {
  const {
    url,
    method = 'get',
    body: reqBody,
    expected: { status: expectedStatus = status.OK, success = true, type } = {},
    token,
  } = testerOptions;
  const query = request[method](url);
  if (reqBody) {
    query.send(reqBody);
  }
  if (token) {
    query.set('authorization', token);
  }
  const res = await query;
  expect(res.status).toBe(expectedStatus);
  const resBody = res.body as T;
  expect(resBody.success).toBe(success);
  if (type && resBody.success === false) {
    expect(resBody.type).toMatch(type);
  }
  return resBody;
};

export default apiTester;
