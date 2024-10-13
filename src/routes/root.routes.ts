import packageJson from '@/../package.json';
import { Router } from 'express';

const rootRoute = Router();

rootRoute.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: `Welcome to the ${packageJson.name} server boss!`,
  });
});

export default rootRoute;
