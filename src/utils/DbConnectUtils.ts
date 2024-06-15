import configs from '@/configs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connection } from 'mongoose';

let mongod: MongoMemoryServer | undefined;

export const getDbUrl = async () => {
  const { db_url, node_env } = configs;
  console.log(node_env, 'node_env');
  let db_url_test: string | undefined;
  if (node_env === 'test') {
    try {
      mongod = await MongoMemoryServer.create();
      db_url_test = mongod.getUri();
    } catch (error) {
      console.log('Test MongoMemoryServer creation failed: ', (error as Error).message);
      process.exit(1);
    }
  }

  return db_url_test || db_url;
};

export const disconnectDB = async () => {
  try {
    await connection.close();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.log('Mongodb disconnect failed: ', (err as Error).message);
    process.exit(1);
  }
};
