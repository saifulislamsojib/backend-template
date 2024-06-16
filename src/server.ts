import configs from './configs';
import dbConnect from './configs/dbConnect';
import catchEnvValidation from './utils/catchEnvValidation';
import server, { closeServer } from './utils/serverUtils';

const main = async () => {
  try {
    // check env validation
    await catchEnvValidation();

    // database connection with mongoose(mongodb)
    dbConnect();

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
  closeServer();
});

process.on('uncaughtException', () => {
  console.log('😈 uncaughtException is detected, shutting down the process..');
  closeServer();
});
