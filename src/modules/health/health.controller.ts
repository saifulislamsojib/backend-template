import packageJson from '@/../package.json' with { type: 'json' };
import type { RequestHandler } from 'express';
import status from 'http-status';

const health: RequestHandler = (_req, res) => {
  res.status(status.OK).json({
    success: true,
    statusCode: status.OK,
    message: 'Server is up and running',
    version: packageJson.version,
  });
};

export default health;
