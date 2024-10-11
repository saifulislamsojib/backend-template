import { MongoMemoryServer } from 'mongodb-memory-server';

const globalSetup = async () => {
  const instance = await MongoMemoryServer.create();
  process.env.DB_URI = instance.getUri();

  return () => {
    return instance.stop();
  };
};

export default globalSetup;
