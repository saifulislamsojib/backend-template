import { Router } from 'express';
import packageJson from '@/../package.json';

const rootRoute = Router();

rootRoute.get('/', (_req, res) => {
  return res.status(200).json({
    success: true,
    message: `Welcome to the ${packageJson.name} server boss!`,
  });
});

export default rootRoute;
