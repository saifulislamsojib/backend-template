import mongoose from 'mongoose';
import configs from './index.ts';
import logger from './logger.ts';

let isDbConnected = false;

/**
 * Connects to the MongoDB database using the provided url.
 * @returns Promise that resolves to true if the connection is successful, false if it fails.
 */
export const dbConnect = async () => {
  try {
    await mongoose.connect(configs.db_url);
    logger.info('Database successfully connected!');
    isDbConnected = true;
  } catch (error) {
    logger.fatal({ errorMsg: (error as Error).message }, 'Database connection error');
    process.exit(1);
  }
  return isDbConnected;
};

/**
 * Disconnect from the MongoDB database.
 *
 * @returns A promise that is resolved when the disconnection is successfully completed, and logs error if there is an error.
 */
export const dbDisconnect = async () => {
  if (!mongoose.connection) return;
  try {
    await mongoose.connection.close();
  } catch (error) {
    logger.fatal('Database disconnection error: ', (error as Error).message);
  }
};

mongoose.connection.on('disconnected', () => {
  if (isDbConnected) {
    logger.fatal('Database disconnected!');
  }
});
