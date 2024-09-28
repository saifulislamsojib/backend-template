import { connect, connection } from 'mongoose';
import configs from '.';
import logger from './logger';

/**
 * Connects to the MongoDB database using the provided url.
 * @param db_url - The database url to connect to. Defaults to the `db_url` in the application config.
 * @returns - Promise that resolves to true if the connection is successful, false if it fails.
 */
export const dbConnect = async (db_url = configs.db_url) => {
  try {
    await connect(db_url);
    logger.info('Database successfully connected!');
    return true;
  } catch (error) {
    logger.fatal({ errorMsg: (error as Error).message }, 'Database connection error');
    return false;
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
