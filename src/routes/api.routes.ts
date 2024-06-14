import health from '@/middleware/health';
import authRoutes from '@/modules/auth/auth.route';
import { Router } from 'express';

const apiRoutes = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/health',
    route: health,
  },
];

moduleRoutes.forEach((route) => apiRoutes.use(route.path, route.route));

export default apiRoutes;
