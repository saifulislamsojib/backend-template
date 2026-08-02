import { request } from '@/test/apiTester';
import { status } from 'http-status';
import packageJson from '@/../package.json' with { type: 'json' };

const baseUrl = '/api/v1/health';

describe(`Health api test, API = ${baseUrl}`, () => {
  it(`GET API = ${baseUrl} (health)`, async () => {
    const res = await request.get(baseUrl);
    expect(res.status).toBe(status.OK);
    expect(res.body).toStrictEqual({
      success: true,
      statusCode: status.OK,
      message: 'Server is up and running',
      data: { status: 'up', version: packageJson.version },
    });
  });
});
