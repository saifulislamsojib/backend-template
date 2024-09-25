import app from '@/app';
import { dbDisconnect } from '@/configs/db';
import { createServer } from 'http';

// create server
const server = createServer(app);

/**
 * Closes the server and disconnects from the database.
 *
 * This function is usually called when an unhandledRejection or uncaughtException
 * is detected. It's also called when the process is about to exit.
 */
export const closeServer = () => {
  if (server) {
    dbDisconnect();
    server.close(() => {
      process.exit(1);
    });
  }
};

export default server;
