import AppError from '@/errors/AppError';
import { ERROR_TYPE } from '@/errors/error.const';
import express from 'express';
import { status } from 'http-status';
import { Error as MongooseError, Types } from 'mongoose';
import supertest from 'supertest';
import { z } from 'zod';
import globalErrorHandler from './globalErrorhandler';

const { env, logger } = vi.hoisted(() => ({
  env: Object.freeze({ NODE_ENV: 'test' }),
  logger: { error: vi.fn(), fatal: vi.fn() },
}));

vi.mock('@/configs/env', () => ({ default: env }));
vi.mock('@/configs/logger', () => ({ default: logger }));

const app = express();

app.get('/expected-error', () => {
  throw new AppError(status.FORBIDDEN, 'Access denied');
});
app.get('/unexpected-error', () => {
  throw new Error('Unexpected failure');
});
app.get('/validation-error', () => {
  z.object({ name: z.string() }).parse({});
});
app.get('/duplicate-error', () => {
  throw Object.assign(new Error('E11000 duplicate key: { email: "john@example.com" }'), {
    code: 11000,
  });
});
app.get('/cast-error', () => {
  const error = new Error('Invalid id');
  error.name = 'CastError';
  Object.assign(error, { stringValue: '"not-an-id"' });
  throw error;
});
app.get('/mongoose-validation-error', () => {
  const error = new MongooseError.ValidationError();
  error.addError('name', new MongooseError.ValidatorError({ message: 'Name is required' }));
  throw error;
});
app.use(globalErrorHandler);

describe('globalErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps expected authorization errors to the standard error envelope', async () => {
    const res = await supertest(app).get('/expected-error');

    expect(res.status).toBe(status.FORBIDDEN);
    expect(res.body).toStrictEqual({
      success: false,
      statusCode: status.FORBIDDEN,
      message: 'Access denied',
      type: ERROR_TYPE.forbidden,
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('does not expose unexpected error details or stacks in test environments', async () => {
    const res = await supertest(app).get('/unexpected-error');

    expect(res.status).toBe(status.INTERNAL_SERVER_ERROR);
    expect(res.body).toStrictEqual({
      success: false,
      statusCode: status.INTERNAL_SERVER_ERROR,
      message: 'Unexpected failure',
      type: ERROR_TYPE.serverError,
    });
    expect(res.body).not.toHaveProperty('stack');
    expect(logger.fatal).toHaveBeenCalledOnce();
  });

  it('maps Zod validation failures to a client-safe validation response', async () => {
    const res = await supertest(app).get('/validation-error');

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: status.BAD_REQUEST,
      type: ERROR_TYPE.validationError,
    });
  });

  it('maps duplicate-key and invalid-id database errors to stable client responses', async () => {
    const duplicate = await supertest(app).get('/duplicate-error');
    const cast = await supertest(app).get('/cast-error');

    expect(duplicate.body).toMatchObject({
      statusCode: status.BAD_REQUEST,
      type: ERROR_TYPE.duplicateEntry,
      message: 'john@example.com is already exists',
    });
    expect(cast.body).toStrictEqual({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: '"not-an-id" is not a valid ID!',
      type: ERROR_TYPE.castError,
    });
  });

  it('maps Mongoose validation failures to a validation response', async () => {
    const res = await supertest(app).get('/mongoose-validation-error');

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toStrictEqual({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: 'Name is required.',
      type: ERROR_TYPE.validationError,
    });
  });

  it('omits PII (userEmail) and includes reqId and userId in error logs', async () => {
    const userApp = express();

    const userId = new Types.ObjectId();
    const reqId = 'req-abc-123';

    userApp.use((req, _res, next) => {
      req.id = reqId;
      req.user = {
        _id: userId,
        email: 'secret@example.com',
        role: 'user',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      next();
    });

    userApp.get('/error', () => {
      throw new AppError(status.BAD_REQUEST, 'User error');
    });

    userApp.use(globalErrorHandler);
    await supertest(userApp).get('/error');
    expect(logger.error).toHaveBeenCalledOnce();
    const logPayload = logger.error.mock.calls[0]?.[0] as AnyObject;
    expect(logPayload).toMatchObject({
      reqId,
      userId,
    });
    expect(logPayload).not.toHaveProperty('userEmail');
  });
});
