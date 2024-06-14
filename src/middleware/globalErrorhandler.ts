import configs from '@/configs';
import AppError from '@/errors/AppError';
import { ErrorRequestHandler } from 'express';
import { BAD_REQUEST, UNAUTHORIZED } from 'http-status';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';

const globalErrorHandler: ErrorRequestHandler = (err: Error, _req, res, next) => {
  if (res.headersSent) {
    return next('Something went wrong!');
  }
  let statusCode = err instanceof AppError ? err.statusCode : 500;
  let message = err instanceof AppError ? 'App Error' : err.message || 'Server Error!';
  let errorMessage = err.message || 'Something went wrong!';
  let errorDetails: Error | null = err;
  let stack = err.stack as string | null;

  if (err instanceof ZodError) {
    message = 'Validation Error';
    statusCode = BAD_REQUEST;
    errorMessage = err.issues.reduce((acc, { path, message: msg, code }) => {
      const lastPath = path?.[path.length - 1];
      const singleMessage = code === 'custom' ? msg : `${lastPath} is ${msg?.toLowerCase()}`;
      return `${acc}${acc ? ' ' : ''}${singleMessage}.`;
    }, '');
  } else if (err.name === 'CastError') {
    message = 'Invalid ID';
    statusCode = BAD_REQUEST;
    errorMessage = `${(err as MongooseError.CastError).stringValue} is not a valid ID!`;
  } else if ('code' in err && err.code === 11000) {
    const match = err.message.match(/"([^"]*)"/);
    const extractedMessage = match && match[1];

    message = 'Duplicate Entry';
    statusCode = BAD_REQUEST;
    errorMessage = `${extractedMessage} is already exists`;
  } else if (err instanceof MongooseError.ValidationError) {
    message = 'Validation Error';
    statusCode = BAD_REQUEST;
    errorMessage = Object.values(err.errors).reduce(
      (acc, { message: msg }) => `${acc}${acc ? ' ' : ''}${msg}`,
      '',
    );
  } else if (err instanceof AppError && err.statusCode === UNAUTHORIZED) {
    message = 'Unauthorized Access';
    statusCode = UNAUTHORIZED;
    errorMessage = 'You do not have the necessary permissions to access this resource.';
    errorDetails = null;
    stack = null;
  }
  return res.status(statusCode).json({
    success: false,
    message,
    errorMessage,
    errorDetails,
    stack: configs.node_env === 'development' ? stack : null,
  });
};

export default globalErrorHandler;
