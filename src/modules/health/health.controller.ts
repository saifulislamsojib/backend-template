import packageJson from '@/../package.json' with { type: 'json' };
import sendResponse from '@/utils/sendResponse';
import type { RequestHandler } from 'express';
import { status } from 'http-status';

const health: RequestHandler = (_req, res) => {
  return sendResponse(res, {
    data: {
      status: 'up',
      version: packageJson.version,
    },
    success: true,
    statusCode: status.OK,
    message: 'Server is up and running',
  });
};

export default health;
