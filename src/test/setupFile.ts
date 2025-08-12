import { dbConnect, dbDisconnect } from '#configs/db';

beforeAll(dbConnect, 5000);

afterAll(dbDisconnect);
