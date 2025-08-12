import authRoutes from '#modules/auth/auth.route';
import healthRoute from '#modules/health/health.route';
import { Router } from 'express';

const apiRoutes = Router();

const moduleRoutes = [
  { path: '/auth', route: authRoutes },
  { path: '/health', route: healthRoute },
];

moduleRoutes.forEach((route) => apiRoutes.use(route.path, route.route));

export default apiRoutes;
