import env from '@/configs/env';
import logger from '@/configs/logger';
import globalErrorHandler from '@/middleware/globalErrorhandler';
import notFound from '@/middleware/notFound';
import apiRoutes from '@/routes/api.routes';
import rootRoute from '@/routes/root.routes';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

const { CLIENT_ORIGIN, NODE_ENV } = env;

// app initialization
const app = express();

// app middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({ origin: CLIENT_ORIGIN }));
app.enable('trust proxy');
app.enable('case sensitive routing');
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.disable('x-powered-by');
app.use(helmet({ xPoweredBy: false }));

// Use pino-http middleware for HTTP request logging
if (NODE_ENV !== 'test') {
  app.use(pinoHttp({ logger }));
}

// all routes
app.use('/', rootRoute);
app.use('/api/v1', apiRoutes);

// not found route handler
app.use(notFound);

// global error handler.
app.use(globalErrorHandler);

export default app;
