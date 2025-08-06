import app from '@/app.js';
import { dbDisconnect } from '@/configs/db.js';
import redisClient from '@/configs/redis.js';
import { createServer } from 'node:http';

// create server
const server = createServer(app);

/**
 * Closes the server and disconnects from the database and redis.
 *
 * This function is usually called when an unhandledRejection or uncaughtException
 * is detected. It's also called when the process is about to exit.
 */
export const closeServer = async () => {
  await Promise.all([dbDisconnect(), redisClient.destroy()]);
  if (server.listening) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

export default server;
