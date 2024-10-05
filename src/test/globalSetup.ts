import { MongoMemoryServer } from 'mongodb-memory-server';
import global from './global';

const globalSetup = async () => {
  const instance = await MongoMemoryServer.create();
  global.__MONGO_INSTANCE = instance;
  process.env.DB_URI = instance.getUri();
  console.log(`Database connection string: ${process.env.DB_URI}`);
};

export default globalSetup;
