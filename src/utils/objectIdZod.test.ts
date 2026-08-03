import { Types } from 'mongoose';
import { objectIdZod } from './objectIdZod';

describe('objectIdZod', () => {
  it('accepts MongoDB ObjectId strings', () => {
    expect(objectIdZod.parse(new Types.ObjectId().toHexString())).toMatch(/^[a-f\d]{24}$/i);
  });

  it('rejects values that are not ObjectId strings', () => {
    expect(objectIdZod.safeParse('not-an-id').success).toBe(false);
  });
});
