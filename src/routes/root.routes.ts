import packageJson from '@/../package.json';
import { Router } from 'express';
import { OK } from 'http-status';

const rootRoute = Router();

rootRoute.get('/', (_req, res) => {
  res.status(OK).json({
    success: true,
    message: `Welcome to the ${packageJson.name} server boss!`,
  });
});

export default rootRoute;
