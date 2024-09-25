import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import configs from './configs';
import globalErrorhandler from './middleware/globalErrorhandler';
import notFound from './middleware/notFound';
import apiRoute from './routes/api.routes';
import rootRoute from './routes/root.routes';

const { origin, node_env } = configs;

// app initialization
const app = express();

// app middleware
app.use(express.json());
app.use(cors({ origin }));
app.enable('trust proxy');
app.enable('case sensitive routing');
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Use Morgan middleware to log requests
if (node_env !== 'test') {
  app.use(morgan(node_env === 'development' ? 'dev' : 'combined'));
}

// all routes
app.use('/', rootRoute);
app.use('/api/v1', apiRoute);

// not found
app.use(notFound);
// global error handler
app.use(globalErrorhandler);

export default app;
