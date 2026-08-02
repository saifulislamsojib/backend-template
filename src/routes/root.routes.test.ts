import packageJson from '@/../package.json' with { type: 'json' };
import { request } from '@/test/apiTester';
import { status } from 'http-status';

describe('Root route', () => {
  it('uses the standard success response envelope', async () => {
    const res = await request.get('/');

    expect(res.status).toBe(status.OK);
    expect(res.body).toStrictEqual({
      success: true,
      statusCode: status.OK,
      message: `Welcome to the ${packageJson.name} server boss!`,
      data: { name: packageJson.name, version: packageJson.version },
    });
  });
});
