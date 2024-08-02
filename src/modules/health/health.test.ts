import configs from '@/configs';
import { request } from '@/utils/test.api';

const baseUrl = `${configs.api_route}/health` as const;

describe(`Health api test, API = ${baseUrl}`, () => {
  it(`GET API = ${baseUrl} (health)`, async () => {
    const res = await request.get(baseUrl);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
