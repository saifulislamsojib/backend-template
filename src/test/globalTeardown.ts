import { MongoMemoryServer } from 'mongodb-memory-server';
import global from './global';

export default async function globalTeardown() {
  const instance: MongoMemoryServer = global.__MONGOINSTANCE;
  await instance.stop();
}
