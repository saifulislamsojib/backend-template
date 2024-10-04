import { MongoMemoryServer } from 'mongodb-memory-server';
import global from './global';

const globalSetup = async () => {
  const instance = await MongoMemoryServer.create();
  global.__MONGOINSTANCE = instance;
  process.env.DB_URI = instance.getUri();
};

export default globalSetup;
