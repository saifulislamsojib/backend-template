import packageJson from '@/../package.json' with { type: 'json' };
import sendResponse from '@/utils/sendResponse';
import { Router } from 'express';
import { status } from 'http-status';

const rootRoute = Router();

rootRoute.get('/', (_req, res) => {
  return sendResponse(res, {
    data: {
      name: packageJson.name,
      version: packageJson.version,
    },
    success: true,
    statusCode: status.OK,
    message: `Welcome to the ${packageJson.name} server boss!`,
  });
});

export default rootRoute;
