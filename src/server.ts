import { dbConnect } from '@/configs/db';
import env from '@/configs/env';
import logger from '@/configs/logger';
import redisClient from '@/configs/redis';
import server, { closeServer } from '@/utils/server';

const main = async () => {
  // redis connection
  const connection = redisClient.connect();

  // database connection with mongodb using mongoose
  const [isDbConnected] = await Promise.all([dbConnect(), connection]);

  // if db is connected successfully then start the server otherwise not
  if (isDbConnected) {
    server.listen(env.PORT, () => {
      logger.info(`Hello Boss! I am listening at http://localhost:${env.PORT}`);
    });
  }
};

main().catch((error) => {
  logger.fatal({ errorMsg: (error as Error).message }, 'Server connection error');
  process.exit(1);
});

process.on('unhandledRejection', () => {
  logger.fatal('😈 unhandledRejection is detected, shutting down the process..');
  closeServer(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal(
    { errorMsg: error.message },
    '😈 uncaughtException is detected, shutting down the process..',
  );
  closeServer(1);
});

const onClose = () => closeServer(0);

process.on('SIGINT', onClose);

process.on('SIGTERM', onClose);
