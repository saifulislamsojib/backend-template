import { Router } from 'express';
import health from './health.controller';

const healthRoute = Router();

healthRoute.get('/', health);

export default healthRoute;
