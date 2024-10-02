import configs from '@/configs';
import client from '@/configs/redis';

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

export const deleteKeysByPattern = async (pattern: string, givenCursor = 0) => {
  let cursor = givenCursor;
  const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 1000 });
  cursor = reply.cursor;
  await Promise.all(reply.keys.map((key) => client.del(key)));
  if (cursor !== 0) {
    await deleteKeysByPattern(pattern, cursor);
  }
};

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

export const clearAllCache = async () => {
  return client.flushAll();
};
