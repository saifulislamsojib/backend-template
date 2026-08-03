import express from 'express';
import { status } from 'http-status';
import supertest from 'supertest';
import globalErrorHandler from './globalErrorhandler';
import uploader from './uploader';

const { env, logger } = vi.hoisted(() => ({
  env: Object.freeze({ NODE_ENV: 'test' }),
  logger: { error: vi.fn(), fatal: vi.fn() },
}));

vi.mock('@/configs/env', () => ({ default: env }));
vi.mock('@/configs/logger', () => ({ default: logger }));

const app = express();

app.post('/upload', uploader.single('file'), (_req, res) => {
  res.sendStatus(status.NO_CONTENT);
});
app.use(globalErrorHandler);

describe('uploader', () => {
  it('rejects unsupported file types with the standard validation error envelope', async () => {
    const res = await supertest(app).post('/upload').attach('file', Buffer.from('not an image'), {
      contentType: 'text/plain',
      filename: 'note.txt',
    });

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toStrictEqual({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: 'Only jpeg, jpg, and png files are allowed',
      type: 'appError',
    });
  });
});
