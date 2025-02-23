import configs from '@/configs';
import { request } from '@/test/apiTester';
import { OK } from 'http-status';

const baseUrl = `${configs.api_route}/health` as const;

describe(`Health api test, API = ${baseUrl}`, () => {
  it(`GET API = ${baseUrl} (health)`, async () => {
    const res = await request.get(baseUrl);
    expect(res.status).toBe(OK);
    expect((res.body as { success: boolean }).success).toBe(true);
  });
});
