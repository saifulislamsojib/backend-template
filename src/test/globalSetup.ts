import { MongoMemoryReplSet } from 'mongodb-memory-server';

const globalSetup = async () => {
  const instance = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  process.env.DB_URI = instance.getUri();

  process.env.APP_KEY = 'test-app-key';
  process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret';
  process.env.CLIENT_ORIGIN = 'http://localhost:3000';
  process.env.BCRYPT_SALT_ROUNDS = '10';

  return () => {
    return instance.stop();
  };
};

export default globalSetup;
