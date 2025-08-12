import packageJson from '#./../package.json' with { type: 'json' };
import { Router } from 'express';
import { status } from 'http-status';

const rootRoute = Router();

rootRoute.get('/', (_req, res) => {
  res.status(status.OK).json({
    success: true,
    message: `Welcome to the ${packageJson.name} server boss!`,
  });
});

export default rootRoute;
