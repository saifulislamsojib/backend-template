import app from '@/app';
import env from '@/configs/env';
import { AUTH_TOKEN_KEY, X_APP_KEY } from '@/modules/auth/auth.utils';
import type { TResponse } from '@/utils/sendResponse';
import { status } from 'http-status';
import supertest from 'supertest';

const request = supertest(app);

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
  appToken?: string;
  isApp?: boolean;
  cookie?: string;
  onResponse?: (res: supertest.Response) => void;
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
 * - `appToken`: the value of the `authorization` header to set. Optional.
 * - `isApp`: if true, set `X_APP_KEY` header. Optional.
 * - `cookie`: cookie string to set. Optional.
 * - `onResponse`: optional callback to inspect raw response.
 *
 * @returns a promise that resolves to the response body
 */
const apiTester = async <T extends Response = Response>(testerOptions: TesterProps) => {
  const {
    url,
    method = 'get',
    body: reqBody,
    expected: { status: expectedStatus = status.OK, success = true, type } = {},
    appToken,
    cookie,
    isApp,
    onResponse,
  } = testerOptions;
  const query = request[method](url);
  if (reqBody) {
    query.send(reqBody);
  }
  if (appToken) {
    query.set('authorization', `Bearer ${appToken}`);
    query.set(X_APP_KEY, env.APP_KEY);
  } else if (cookie) {
    query.set('cookie', `${AUTH_TOKEN_KEY}=${cookie}`);
  } else if (isApp) {
    query.set(X_APP_KEY, env.APP_KEY);
  }
  const res = await query;
  if (onResponse) {
    onResponse(res);
  }
  expect(res.status).toBe(expectedStatus);
  const resBody = res.body as T;
  expect(resBody.success).toBe(success);
  if (type && !resBody.success) {
    expect(resBody.type).toMatch(type);
  }
  return resBody;
};

export { request };
export default apiTester;
