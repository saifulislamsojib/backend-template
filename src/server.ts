import configs from './configs';
import mongoConnect from './configs/dbConnect';
import { disconnectDB } from './utils/DbConnectUtils';
import catchEnvValidation from './utils/catchEnvValidation';
import server, { closeServer } from './utils/serverUtils';

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

process.on('unhandledRejection', async () => {
  console.log('😈 unhandledRejection is detected, shutting down the process..');
  await closeServer();
});

process.on('uncaughtException', async () => {
  console.log('😈 uncaughtException is detected, shutting down the process..');
  await disconnectDB();
  process.exit(1);
});
