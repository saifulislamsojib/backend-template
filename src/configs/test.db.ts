/* eslint-disable no-console */ /* for this file only */

import { MongoMemoryServer } from 'mongodb-memory-server';
import configs from '.';
import { dbConnect, dbDisconnect } from './db';

let mongod: MongoMemoryServer | undefined;

/**
 * Connect to a test database.
 *
 * If the current node environment is set to 'test', this function will
 * create a new in-memory MongoDB server and connect to it.
 */
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

/**
 * Disconnect from a test database.
 *
 * If the current node environment is set to 'test', this function will
 * disconnect from the in-memory MongoDB server and stop it.
 */
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

process.on('SIGINT', testDbDisconnect);
