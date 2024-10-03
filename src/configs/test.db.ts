import { MongoMemoryServer } from 'mongodb-memory-server';
import configs from '.';
import { dbConnect, dbDisconnect } from './db';
import logger from './logger';
import redisClient from './redis';

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
      logger.fatal({ errorMsg: (error as Error).message }, 'Test database creation error');
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
  } catch (error) {
    logger.fatal({ errorMsg: (error as Error).message }, 'Test database stopping error');
  }
};
process.on('unhandledRejection', () => {
  logger.fatal('😈 unhandledRejection is detected, shutting down the process..');
  testDbDisconnect();
});

process.on('uncaughtException', (error) => {
  logger.fatal(
    { errorMsg: error.message },
    '😈 uncaughtException is detected, shutting down the process..',
  );
  testDbDisconnect();
});

process.on('SIGINT', () => Promise.all([testDbDisconnect(), redisClient.disconnect()]));
