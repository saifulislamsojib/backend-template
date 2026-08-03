import { deleteCache, getCache, getCacheKey, getOrSetCache, setCache } from './redis';

const { cacheKeyPrefix, logger, redisClient } = vi.hoisted(() => ({
  cacheKeyPrefix: 'test',
  logger: { warn: vi.fn() },
  redisClient: {
    del: vi.fn(),
    get: vi.fn(),
    scan: vi.fn(),
    setEx: vi.fn(),
  },
}));

vi.mock('@/configs/env', () => ({
  default: {
    REDIS_CACHE_KEY_PREFIX: cacheKeyPrefix,
    REDIS_CACHE_REVALIDATE_TIME_IN_SECONDS: 60,
  },
}));
vi.mock('@/configs/logger', () => ({ default: logger }));
vi.mock('@/configs/redis', () => ({ default: redisClient }));

describe('cache utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses an application namespace for cache keys and patterns', async () => {
    redisClient.scan.mockResolvedValue({ cursor: '0', keys: [] });

    expect(getCacheKey('users:42')).toBe(`${cacheKeyPrefix}:users:42`);
    await deleteCache({ patterns: '*' });

    expect(redisClient.scan).toHaveBeenCalledWith('0', {
      MATCH: `${cacheKeyPrefix}:*`,
      COUNT: 1000,
    });
  });

  it('treats a Redis read failure as a cache miss', async () => {
    redisClient.get.mockRejectedValue(new Error('Redis unavailable'));

    await expect(getCache('users:42')).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'get' }),
      'Cache operation failed',
    );
  });

  it('invalidates malformed JSON and treats it as a cache miss', async () => {
    redisClient.get.mockResolvedValue('{not-json');
    redisClient.del.mockResolvedValue(1);

    await expect(getCache('users:42')).resolves.toBeUndefined();
    expect(redisClient.del).toHaveBeenCalledWith(`${cacheKeyPrefix}:users:42`);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'parse' }),
      'Cache operation failed',
    );
  });

  it('does not fail callers when cache writes fail', async () => {
    redisClient.setEx.mockRejectedValue(new Error('Redis unavailable'));

    await expect(setCache('users:42', { id: 42 })).resolves.toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'set' }),
      'Cache operation failed',
    );
  });

  it('runs a concurrent cache miss callback once per key', async () => {
    redisClient.get.mockResolvedValue(null);
    redisClient.setEx.mockResolvedValue('OK');
    const callback = vi.fn(() => Promise.resolve({ id: 42 }));

    const [first, second] = await Promise.all([
      getOrSetCache('users:42', callback),
      getOrSetCache('users:42', callback),
    ]);

    expect(callback).toHaveBeenCalledOnce();
    expect(first).toStrictEqual({ id: 42 });
    expect(second).toStrictEqual({ id: 42 });
  });
});
