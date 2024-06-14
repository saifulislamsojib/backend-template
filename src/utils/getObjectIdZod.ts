import { Types } from 'mongoose';
import { z } from 'zod';

const getObjectIdZod = () => {
  const objectIdZod = z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid MongoDB ObjectID',
  });
  return objectIdZod;
};

export default getObjectIdZod;
