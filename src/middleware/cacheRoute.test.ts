import cacheRoute, { deleteRouteCache, getRouteCacheKey, setRouteCache } from './cacheRoute';

const { redisClient } = vi.hoisted(() => ({
  redisClient: {
    del: vi.fn(),
    get: vi.fn(),
    scan: vi.fn(),
    setEx: vi.fn(),
  },
}));

vi.mock('@/configs/logger', () => ({ default: { warn: vi.fn() } }));
vi.mock('@/configs/redis', () => ({ default: redisClient }));

describe('cacheRoute middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('continues to the route handler when Redis is unavailable', async () => {
    redisClient.get.mockRejectedValue(new Error('Redis unavailable'));
    const next = vi.fn();
    const middleware = cacheRoute();

    await middleware({ originalUrl: '/api/v1/health' } as never, {} as never, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it('scopes protected cache keys to the authenticated user and role', () => {
    const req = {
      originalUrl: '/api/v1/auth/me',
      user: { _id: { toString: () => 'user-42' }, role: 'admin' },
    } as never;

    expect(getRouteCacheKey(req, 'protected')).toBe('/api/v1/auth/me:user-42:admin');
  });

  it('stores and deletes route data using the generated key', async () => {
    redisClient.setEx.mockResolvedValue('OK');
    redisClient.del.mockResolvedValue(1);
    const req = { originalUrl: '/api/v1/health' } as never;

    await expect(setRouteCache(req, { status: 'up' })).resolves.toBe(true);
    await expect(deleteRouteCache(req)).resolves.toBe(true);

    expect(redisClient.setEx).toHaveBeenCalledWith(
      'backend-template:/api/v1/health',
      86400,
      JSON.stringify({ status: 'up' }),
    );
    expect(redisClient.del).toHaveBeenCalledWith('backend-template:/api/v1/health');
  });
});
