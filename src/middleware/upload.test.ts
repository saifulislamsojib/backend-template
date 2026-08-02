import globalErrorHandler from '@/middleware/globalErrorhandler';
import { createSingleUpload } from '@/middleware/upload';
import express from 'express';
import { status } from 'http-status';
import supertest from 'supertest';

const png = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000154a24f5d0000000049454e44ae426082',
  'hex',
);

const app = express();
app.post(
  '/image',
  createSingleUpload('image', {
    acceptedContentTypes: ['image/png'],
    maxFileSizeBytes: 100,
    required: true,
  }),
  (req, res) => res.status(status.OK).json({ contentType: req.upload?.contentType }),
);
app.use(globalErrorHandler);

describe('upload middleware', () => {
  it('accepts a PNG whose declared type matches its content', async () => {
    const response = await supertest(app)
      .post('/image')
      .attach('image', png, { filename: 'avatar.png', contentType: 'image/png' });

    expect(response.status).toBe(status.OK);
    expect(response.body).toEqual({ contentType: 'image/png' });
  });

  it('rejects spoofed MIME types', async () => {
    const response = await supertest(app)
      .post('/image')
      .attach('image', png, { filename: 'avatar.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(status.BAD_REQUEST);
    expect((response.body as { message: string }).message).toBe(
      'Uploaded file type does not match its content',
    );
  });

  it('maps oversized Multer uploads to a stable 413 response', async () => {
    const response = await supertest(app)
      .post('/image')
      .attach('image', Buffer.alloc(101), { filename: 'large.png', contentType: 'image/png' });

    expect(response.status).toBe(status.REQUEST_ENTITY_TOO_LARGE);
    expect(response.body).toMatchObject({
      success: false,
      type: 'appError',
      message: 'Uploaded file exceeds the allowed size',
    });
  });
});
