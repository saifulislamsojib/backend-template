import { dbConnect, dbDisconnect } from '../configs/db.js';

beforeAll(dbConnect, 5000);

afterAll(dbDisconnect);
