import type { MongoMemoryServer } from 'mongodb-memory-server';

type TestGlobal = typeof globalThis & { __MONGO_INSTANCE: MongoMemoryServer };

export default global as TestGlobal;
