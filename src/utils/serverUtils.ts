import app from '@/app';
import { createServer } from 'http';
import { disconnectDB } from './DbConnectUtils';

// create server
const server = createServer(app);

export const closeServer = async () => {
  if (server) {
    await disconnectDB();
    server.close(() => {
      process.exit(1);
    });
  }
};

export default server;
