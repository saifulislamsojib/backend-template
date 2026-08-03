import cacheRoute from './cacheRoute';

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
});
