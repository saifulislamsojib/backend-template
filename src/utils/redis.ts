import env from '@/configs/env';
import logger from '@/configs/logger';
import client from '@/configs/redis';

const inFlightCacheReads = new Map<string, Promise<unknown>>();

/**
 * Builds an application-scoped Redis cache key.
 *
 * @param key - The unprefixed cache key.
 * @returns The key namespaced with `REDIS_CACHE_KEY_PREFIX`.
 */
const getCacheKey = (key: string) => `${env.REDIS_CACHE_KEY_PREFIX}:${key}`;

const logCacheError = (operation: string, key: string, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown cache error';
  logger.warn({ cacheKey: key, errorMsg: message, operation }, 'Cache operation failed');
};

/**
 * Deletes one application-scoped cache entry without propagating Redis failures.
 *
 * @param key - The unprefixed cache key.
 * @returns `true` when Redis accepts the deletion; otherwise `false`.
 */
const deleteCacheKey = async (key: string) => {
  const cacheKey = getCacheKey(key);

  try {
    await client.del(cacheKey);
    return true;
  } catch (error) {
    logCacheError('delete', cacheKey, error);
    return false;
  }
};

/**
 * Reads a JSON value from the application cache. Cache errors are treated as misses.
 *
 * @param key - The unprefixed cache key.
 * @returns The parsed cached value, or `undefined` for a miss, malformed value, or Redis error.
 */
const getCache = async <T>(key: string): Promise<T | undefined> => {
  const cacheKey = getCacheKey(key);

  try {
    const cached = await client.get(cacheKey);
    if (cached === null) return undefined;

    try {
      return JSON.parse(cached) as T;
    } catch (error) {
      logCacheError('parse', cacheKey, error);
      await deleteCacheKey(key);
      return undefined;
    }
  } catch (error) {
    logCacheError('get', cacheKey, error);
    return undefined;
  }
};

/**
 * Stores a JSON value in the application cache. A failed cache write never fails the caller.
 *
 * @param key - The unprefixed cache key.
 * @param data - The JSON-serializable value to cache.
 * @returns `true` when Redis accepts the value; otherwise `false`.
 */
const setCache = async (key: string, data: unknown) => {
  const cacheKey = getCacheKey(key);

  try {
    await client.setEx(cacheKey, env.REDIS_CACHE_REVALIDATE_TIME_IN_SECONDS, JSON.stringify(data));
    return true;
  } catch (error) {
    logCacheError('set', cacheKey, error);
    return false;
  }
};

/**
 * Gets data from the cache or computes it once per process for concurrent cache misses.
 *
 * @param key - The unprefixed cache key.
 * @param cb - Retrieves the source value when the key is absent or unavailable.
 * @returns The cached or source value. Source callback errors are propagated.
 */
const getOrSetCache = async <T>(key: string, cb: () => Promise<T>) => {
  const cached = await getCache<T>(key);
  if (cached !== undefined) return cached;

  const existing = inFlightCacheReads.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const request = cb()
    .then(async (data) => {
      await setCache(key, data);
      return data;
    })
    .finally(() => {
      inFlightCacheReads.delete(key);
    });

  inFlightCacheReads.set(key, request);
  return request;
};

/**
 * Deletes application cache keys that match a suffix pattern, such as `users:*`.
 *
 * @param pattern - The unprefixed Redis glob pattern.
 * @param givenCursor - The Redis scan cursor to resume from.
 * @returns `true` after scanning completes, or `false` if Redis is unavailable.
 */
const deleteKeysByPattern = async (pattern: string, givenCursor = '0') => {
  const namespacedPattern = getCacheKey(pattern);

  try {
    const reply = await client.scan(givenCursor, { MATCH: namespacedPattern, COUNT: 1000 });
    if (reply.keys.length > 0) await client.del(reply.keys);
    if (reply.cursor !== '0') await deleteKeysByPattern(pattern, reply.cursor);

    return true;
  } catch (error) {
    logCacheError('delete-pattern', namespacedPattern, error);
    return false;
  }
};

type DeleteCacheKeysOption = {
  keys: string | string[];
};
type DeleteCachePatternOption = {
  patterns: string | string[];
};
type DeleteCacheBothOption = DeleteCacheKeysOption & DeleteCachePatternOption;

type DeleteCacheOptions = DeleteCacheKeysOption | DeleteCachePatternOption | DeleteCacheBothOption;

/**
 * Deletes application cache entries by key(s) or suffix pattern(s). Failures are best-effort.
 *
 * @param options - The cache keys and/or glob patterns to delete.
 * @returns Resolves after every requested deletion has been attempted.
 * @example
 * await deleteCache({ keys: ['users:42', 'posts:17'] });
 * await deleteCache({ patterns: ['users:*', 'posts:*'] });
 * await deleteCache({ keys: 'users:42', patterns: 'posts:*' });
 */
const deleteCache = async (options: DeleteCacheOptions) => {
  const tasks: Promise<unknown>[] = [];

  if ('keys' in options) {
    const keys = Array.isArray(options.keys) ? options.keys : [options.keys];
    tasks.push(...keys.map((key) => deleteCacheKey(key)));
  }
  if ('patterns' in options) {
    const patterns = Array.isArray(options.patterns) ? options.patterns : [options.patterns];
    tasks.push(...patterns.map((pattern) => deleteKeysByPattern(pattern)));
  }

  await Promise.all(tasks);
};

export {
  deleteCache,
  deleteCacheKey,
  deleteKeysByPattern,
  getCache,
  getCacheKey,
  getOrSetCache,
  setCache,
};
