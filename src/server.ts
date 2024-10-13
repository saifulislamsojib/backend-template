import configs from './configs';
import { dbConnect } from './configs/db';
import logger from './configs/logger';
import redisClient from './configs/redis';
import catchEnvValidation from './utils/catchEnvValidation';
import server, { closeServer } from './utils/serverUtils';

const main = async () => {
  // check env validation
  const ok = await catchEnvValidation();
  if (!ok) return;

  // redis connection
  const connection = redisClient.connect();

  // database connection with mongodb using mongoose
  const [isDbConnected] = await Promise.all([dbConnect(), connection]);

  // if db is connected successfully then start the server otherwise not
  if (isDbConnected) {
    const { port } = configs;

    server.listen(port, () => {
      logger.info(`Hello Boss! I am listening at http://localhost:${port}`);
    });
  }
};

main().catch((error) => {
  logger.fatal({ errorMsg: (error as Error).message }, 'Server connection error');
  setTimeout(() => {
    process.exit(1);
  }, 100);
});

process.on('unhandledRejection', async () => {
  logger.fatal('😈 unhandledRejection is detected, shutting down the process..');
  await closeServer();
});

process.on('uncaughtException', async (error) => {
  logger.fatal(
    { errorMsg: error.message },
    '😈 uncaughtException is detected, shutting down the process..',
  );
  await closeServer();
});

process.on('SIGINT', closeServer);

process.on('SIGTERM', closeServer);
