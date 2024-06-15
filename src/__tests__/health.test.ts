import app from '@/app';
import supertest from 'supertest';

const request = supertest(app);

describe('health test', () => {
  it('GET /api/v1/health', async () => {
    const res = await request.get('/api/v1/health');
    console.log(res.body, 'res');
    expect(res.status).toBe(200);
  });
});
