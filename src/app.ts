import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import pinoHttp from 'pino-http';
import configs from './configs';
import logger from './configs/logger';
import globalErrorhandler from './middleware/globalErrorhandler';
import notFound from './middleware/notFound';
import apiRoute from './routes/api.routes';
import rootRoute from './routes/root.routes';

const { origin, node_env } = configs;

// app initialization
const app = express();

// app middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({ origin }));
app.enable('trust proxy');
app.enable('case sensitive routing');
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Use pino-http middleware for HTTP request logging
if (node_env !== 'test') {
  app.use(pinoHttp({ logger }));
}

// all routes
app.use('/', rootRoute);
app.use('/api/v1', apiRoute);

// not found route handler
app.use(notFound);

// global error handler.
app.use(globalErrorhandler);

export default app;
