import configs from './configs';
import { dbConnect } from './configs/db';
import logger from './configs/logger';
import catchEnvValidation from './utils/catchEnvValidation';
import server, { closeServer } from './utils/serverUtils';

const main = async () => {
  try {
    // check env validation
    await catchEnvValidation();

    // database connection with mongoose(mongodb)
    dbConnect();

    const { port } = configs;

    // listen server
    server.listen(port, () => {
      logger.info(`Hello Boss! I am listening at http://localhost:${port}`);
    });
  } catch (error) {
    logger.fatal(`Server error: ${(error as Error).message}`);
  }
};

main();

process.on('unhandledRejection', () => {
  logger.fatal('😈 unhandledRejection is detected, shutting down the process..');
  closeServer();
});

process.on('uncaughtException', (error) => {
  logger.fatal(
    { errorMsg: error.message },
    '😈 uncaughtException is detected, shutting down the process..',
  );
  closeServer();
});
