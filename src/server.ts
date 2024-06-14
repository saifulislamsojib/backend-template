import { createServer } from 'http';
import app from './app';
import configs from './configs';
import mongoConnect from './configs/dbConnect';
import catchEnvValidation from './utils/catchEnvValidation';

// create server
const server = createServer(app);

const main = async () => {
  try {
    // check env validation
    await catchEnvValidation();

    // database connection with mongoose(mongodb)
    mongoConnect();

    const { port } = configs;

    // listen server
    server.listen(port, () => {
      console.log(`Hello Boss! I am listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.log(`Server error: ${(error as Error).message}`);
  }
};

main();

process.on('unhandledRejection', () => {
  console.log('😈 unhandledRejection is detected, shutting down the process..');
  if (server) {
    return server.close(() => {
      process.exit(1);
    });
  }
  return process.exit(1);
});

process.on('uncaughtException', () => {
  console.log('😈 uncaughtException is detected, shutting down the process..');
  process.exit(1);
});
