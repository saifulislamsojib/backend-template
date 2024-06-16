import configs from '@/configs';
import dbConnect from '@/configs/dbConnect';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connection } from 'mongoose';

let mongod: MongoMemoryServer | undefined;

export const testDbConnect = async () => {
  let db_url: string | undefined;
  if (configs.node_env === 'test') {
    try {
      mongod = await MongoMemoryServer.create();
      db_url = mongod.getUri();
    } catch (error) {
      console.log('Test MongoMemoryServer creation failed: ', (error as Error).message);
    }
  }
  await dbConnect(db_url);
};

export const testDbDisconnect = async () => {
  if (!connection) return;
  try {
    await connection.close();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.log('Mongodb disconnect failed: ', (err as Error).message);
  }
};

process.on('unhandledRejection', async () => {
  console.log('😈 unhandledRejection is detected, shutting down the process..');
  testDbDisconnect();
});

process.on('uncaughtException', async () => {
  console.log('😈 uncaughtException is detected, shutting down the process..');
  testDbDisconnect();
});
