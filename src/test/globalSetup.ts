import logger from '#configs/logger';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const globalSetup = async () => {
  if (!process.env.CI) {
    try {
      process.loadEnvFile('./.env.test');
    } catch {
      logger.error('.env.test file not found');
    }
  }

  const instance = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  process.env.DB_URI = instance.getUri();

  return () => {
    return instance.stop();
  };
};

export default globalSetup;
