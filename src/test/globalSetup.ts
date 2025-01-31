import { MongoMemoryReplSet } from 'mongodb-memory-server';

const globalSetup = async () => {
  const instance = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  process.env.DB_URI = instance.getUri();

  return () => {
    return instance.stop();
  };
};

export default globalSetup;
