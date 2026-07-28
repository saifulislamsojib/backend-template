import { request } from '@/test/apiTester';
import { status } from 'http-status';

const baseUrl = '/api/v1/health';

describe(`Health api test, API = ${baseUrl}`, () => {
  it(`GET API = ${baseUrl} (health)`, async () => {
    const res = await request.get(baseUrl);
    expect(res.status).toBe(status.OK);
    expect((res.body as { success: boolean }).success).toBe(true);
  });
});
