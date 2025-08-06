import { dbConnect } from './configs/db.ts';
import configs from './configs/index.ts';
import logger from './configs/logger.ts';
import redisClient from './configs/redis.ts';
import catchEnvValidation from './utils/catchEnvValidation.ts';
import server, { closeServer } from './utils/serverUtils.ts';

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
  process.exit(1);
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
