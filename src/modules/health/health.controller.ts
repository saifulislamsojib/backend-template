import packageJson from '@/../package.json';
import type { RequestHandler } from 'express';
import { OK } from 'http-status';

const health: RequestHandler = (_req, res) => {
  res.status(OK).json({
    success: true,
    statusCode: OK,
    message: 'Server is up and running',
    version: packageJson.version,
  });
};

export default health;
