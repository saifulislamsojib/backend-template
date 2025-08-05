import configs from '@/configs/index.js';
import client from '@/configs/redis.js';

/**
 * Get data from redis cache or set cache if the key does not exist.
 * If the key exists, the cached data is returned directly.
 * If the key does not exist, the callback function is called and the result is saved to redis cache.
 * @param key - The key to store the data in redis.
 * @param cb - The callback function to get the data if the key does not exist.
 * @returns The data stored in redis cache or the result of the callback function.
 */
export const getOrSetCache = async <T>(key: string, cb: () => Promise<T>) => {
  const cached = await client.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }
  const data = await cb();
  await client.setEx(key, configs.cache_revalidate_time, JSON.stringify(data));
  return data;
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
 * Delete all keys in redis cache that match the given pattern
 * @param pattern - The pattern to match keys in redis cache
 * @param givenCursor - The cursor to start the iteration from, default is '0'
 * @returns A promise that resolves when all matching keys are deleted
 */
export const deleteKeysByPattern = async (pattern: string, givenCursor = '0') => {
  let cursor = givenCursor;
  const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 1000 });
  cursor = reply.cursor;
  await Promise.all(reply.keys.map((key) => client.del(key)));
  if (cursor !== '0') {
    await deleteKeysByPattern(pattern, cursor);
  }
};

/**
 * Delete redis cache by key(s) or pattern(s)
 * @param options - The options to delete cache.
 * @param options.keys - The key(s) to delete from redis cache.
 * @param options.patterns - The pattern(s) to delete from redis cache.
 * @example
 * await deleteCache({ keys: ['key1', 'key2'] });
 * await deleteCache({ patterns: ['prefix:*', 'suffix:*'] });
 * await deleteCache({ keys: ['key1'], patterns: ['prefix:*'] });
 */
export const deleteCache = async (options: DeleteCacheOptions) => {
  if ('keys' in options) {
    if (Array.isArray(options.keys)) {
      await Promise.all(options.keys.map((key) => client.del(key)));
    } else {
      await client.del(options.keys);
    }
  }
  if ('patterns' in options) {
    if (Array.isArray(options.patterns)) {
      await Promise.all(options.patterns.map((pt) => deleteKeysByPattern(pt)));
    } else {
      await deleteKeysByPattern(options.patterns);
    }
  }
};

/**
 * Clear all redis cache.
 * @returns The result of redis `FLUSHALL` command.
 */
export const clearAllCache = async () => {
  return client.flushAll();
};
