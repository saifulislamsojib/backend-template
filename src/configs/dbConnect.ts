import { disconnectDB, getDbUrl } from '@/utils/DbConnectUtils';
import { connect, connection } from 'mongoose';

// database connection with mongoose
const mongoConnect = async () => {
  try {
    const db_url = await getDbUrl();
    await connect(db_url);
    console.log('Database successfully connected!');
  } catch (error) {
    console.log('Database connection error: ', (error as Error).message);
  }
};

connection.on('disconnected', () => {
  console.log('Mongoose disconnected from Database');
});

process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

export default mongoConnect;
