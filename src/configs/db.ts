import { connect, connection } from 'mongoose';
import configs from '.';

// database connection with mongoose
export const dbConnect = async (db_url = configs.db_url) => {
  try {
    await connect(db_url);
    console.log('Database successfully connected!');
  } catch (error) {
    console.log('Database connection error: ', (error as Error).message);
  }
};

// database disconnection with mongoose
export const dbDisconnect = async (isDrop = false) => {
  if (!connection) return;
  if (isDrop && configs.node_env !== 'production') {
    await connection.dropDatabase();
  }
  try {
    await connection.close();
  } catch (error) {
    console.log('Database disconnection error: ', (error as Error).message);
  }
};

connection.on('disconnected', () => {
  console.log('Database successfully disconnected!');
});

process.on('SIGINT', dbDisconnect);
