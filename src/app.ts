import cors from 'cors';
import express from 'express';
import configs from './configs';
import globalErrorhandler from './middleware/globalErrorhandler';
import notFound from './middleware/notFound';
import apiRoute from './routes/api.routes';
import rootRoute from './routes/root.routes';

const { origin } = configs;

// app initialization
const app = express();

// app middleware
app.use(express.json());
app.use(cors({ origin }));

// all routes
app.use('/', rootRoute);
app.use('/api/v1', apiRoute);

// not found
app.use(notFound);
// global error handler
app.use(globalErrorhandler);

export default app;
