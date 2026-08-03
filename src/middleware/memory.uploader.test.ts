import express from 'express';
import { status } from 'http-status';
import supertest from 'supertest';
import globalErrorHandler from './globalErrorhandler';
import memoryUploader from './memory.uploader';

const { env, logger } = vi.hoisted(() => ({
  env: Object.freeze({ NODE_ENV: 'test' }),
  logger: { error: vi.fn(), fatal: vi.fn() },
}));

vi.mock('@/configs/env', () => ({ default: env }));
vi.mock('@/configs/logger', () => ({ default: logger }));

const app = express();

app.post('/upload', memoryUploader.single('file'), (req, res) => {
  res.status(status.OK).json({ contents: req.file?.buffer.toString() });
});
app.use(globalErrorHandler);

describe('memoryUploader', () => {
  it('keeps accepted text uploads in memory', async () => {
    const res = await supertest(app).post('/upload').attach('file', Buffer.from('hello'), {
      contentType: 'text/plain',
      filename: 'note.txt',
    });

    expect(res.status).toBe(status.OK);
    expect(res.body).toStrictEqual({ contents: 'hello' });
  });

  it('rejects non-text uploads with the standard error envelope', async () => {
    const res = await supertest(app).post('/upload').attach('file', Buffer.from('image'), {
      contentType: 'image/png',
      filename: 'image.png',
    });

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: status.BAD_REQUEST,
      type: 'appError',
    });
  });
});
