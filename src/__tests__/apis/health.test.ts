import { apiUrl, request } from '../utils';

const baseUrl = `${apiUrl}/health`;

describe(`Health api test, API = ${baseUrl}`, () => {
  it(`GET API = ${baseUrl} (health)`, async () => {
    const res = await request.get(baseUrl);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
