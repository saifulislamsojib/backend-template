import configs from './configs';
import { dbConnect, dbDisconnect } from './configs/db';
import logger from './configs/logger';
import catchEnvValidation from './utils/catchEnvValidation';
import server, { closeServer } from './utils/serverUtils';

(async () => {
  try {
    // check env validation
    await catchEnvValidation();

    // database connection with mongodb using mongoose
    const isDbConnected = await dbConnect();

    // if db is connected successfully then start the server otherwise not
    if (isDbConnected) {
      const { port } = configs;

      server.listen(port, () => {
        logger.info(`Hello Boss! I am listening at http://localhost:${port}`);
      });
    }
  } catch (error) {
    logger.fatal({ errorMsg: (error as Error).message }, `Server connection error`);
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
})();

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

process.on('SIGINT', async () => {
  await dbDisconnect();
  if (server.listening) {
    server.close();
  }
});
