import packageJson from '@/../package.json';
import { RequestHandler } from 'express';

const health: RequestHandler = (_req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is up and running',
    version: packageJson.version,
  });
};

export default health;
