import app from '@/app';
import { dbDisconnect } from '@/configs/db';
import redisClient from '@/configs/redis';
import { createServer } from 'node:http';

// create server
const server = createServer(app);

/**
 * Closes the server and disconnects from the database and redis.
 *
 * This function is usually called when an unhandledRejection or uncaughtException
 * is detected. It's also called when the process is about to exit.
 */
export const closeServer = (exitCode: number) => {
  const close = () => {
    void Promise.all([redisClient.quit(), dbDisconnect()]).then(() => {
      process.exit(exitCode);
    });
  };
  if (server.listening) {
    server.close(close);
  } else {
    close();
  }
};

export default server;
