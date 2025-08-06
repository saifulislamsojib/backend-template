import logger from '@/configs/logger.js';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { loadEnvFile } from 'node:process';

const globalSetup = async () => {
  if (!process.env.CI) {
    try {
      loadEnvFile('./.env.test');
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
