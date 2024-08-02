import { MongoMemoryServer } from 'mongodb-memory-server';
import configs from '.';
import { dbConnect, dbDisconnect } from './db';

let mongod: MongoMemoryServer | undefined;

export const testDbConnect = async () => {
  if (configs.node_env === 'test') {
    try {
      mongod = await MongoMemoryServer.create();
      const db_url = mongod.getUri();
      await dbConnect(db_url);
    } catch (error) {
      console.log('Test database connection error: ', (error as Error).message);
    }
  }
};

export const testDbDisconnect = async () => {
  try {
    await dbDisconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.log('Mongodb disconnect failed: ', (err as Error).message);
  }
};

process.on('unhandledRejection', () => {
  console.log('😈 unhandledRejection is detected, shutting down the process..');
  testDbDisconnect();
});

process.on('uncaughtException', (error) => {
  console.log('😈 uncaughtException is detected, shutting down the process..');
  console.log('And the error is:', error.message);
  testDbDisconnect();
});
