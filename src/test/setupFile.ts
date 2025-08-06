import { dbConnect, dbDisconnect } from '../configs/db.ts';

beforeAll(dbConnect, 5000);

afterAll(dbDisconnect);
