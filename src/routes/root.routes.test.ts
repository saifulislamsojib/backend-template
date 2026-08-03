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

  it('allows the configured client origin with credentials', async () => {
    const res = await request.get('/').set('Origin', 'http://localhost:3000');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('uses the standard error response envelope for unknown routes', async () => {
    const res = await request.get('/does-not-exist');

    expect(res.status).toBe(status.NOT_FOUND);
    expect(res.body).toStrictEqual({
      success: false,
      statusCode: status.NOT_FOUND,
      message: 'Requested Url Not Found!!',
      type: 'notFound',
    });
  });
});
