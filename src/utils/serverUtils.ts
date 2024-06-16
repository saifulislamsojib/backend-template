import app from '@/app';
import { dbDisconnect } from '@/configs/dbConnect';
import { createServer } from 'http';

// create server
const server = createServer(app);

export const closeServer = () => {
  if (server) {
    dbDisconnect();
    server.close(() => {
      process.exit(1);
    });
  }
};

export default server;
