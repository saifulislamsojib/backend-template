import { Router } from 'express';
import health from './health.controller.js';

const healthRoute = Router();

healthRoute.get('/', health);

export default healthRoute;
