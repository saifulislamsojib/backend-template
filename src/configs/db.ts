import { connect, connection } from 'mongoose';
import configs from '.';
import logger from './logger';

/**
 * Connect to the MongoDB database.
 *
 * @param db_url - The URL of the MongoDB database.
 * @returns A promise that is resolved when the connection is successfully established, and rejected if there is an error.
 */
export const dbConnect = async (db_url = configs.db_url) => {
  try {
    await connect(db_url);
    logger.info('Database successfully connected!');
  } catch (error) {
    logger.fatal('Database connection error: ', (error as Error).message);
  }
};

/**
 * Disconnect from the MongoDB database.
 *
 * @param isDrop - If true, the database is dropped before disconnecting. Default is false.
 * @returns A promise that is resolved when the disconnection is successfully completed, and rejected if there is an error.
 */
export const dbDisconnect = async (isDrop = false) => {
  if (!connection) return;
  if (isDrop && configs.node_env !== 'production') {
    await connection.dropDatabase();
  }
  try {
    await connection.close();
  } catch (error) {
    logger.fatal('Database disconnection error: ', (error as Error).message);
  }
};

connection.on('disconnected', () => {
  logger.fatal('Database disconnected!');
});

process.on('SIGINT', dbDisconnect);
