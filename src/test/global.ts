import type { MongoMemoryServer } from 'mongodb-memory-server';

type TestGlobal = typeof globalThis & { __MONGOINSTANCE: MongoMemoryServer };

export default global as TestGlobal;
