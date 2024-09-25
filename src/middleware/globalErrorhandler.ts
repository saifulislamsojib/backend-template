import configs from '@/configs';
import AppError from '@/errors/AppError';
import sendResponse from '@/utils/sendResponse';
import type { ErrorRequestHandler } from 'express';
import { BAD_REQUEST, UNAUTHORIZED } from 'http-status';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';

/**
 * Global error handler middleware to handle errors in a standard way.
 *
 * @param err - The error object
 * @param _req - The express request object
 * @param res - The express response object
 * @param next - The express next function
 */
const globalErrorHandler: ErrorRequestHandler = (err: Error, _req, res, next) => {
  if (res.headersSent) {
    return next('Something went wrong!');
  }
  const { node_env } = configs;
  let statusCode = err instanceof AppError ? err.statusCode : 500;
  let type = err instanceof AppError ? 'App Error' : 'Server Error!';
  let message = err.message || 'Something went wrong!';
  let errorDetails: Error | null = err;
  let stack = err.stack as string | null;

  if (err instanceof ZodError) {
    type = 'Validation Error';
    statusCode = BAD_REQUEST;
    message = err.issues.reduce((acc, { path, message: msg, code }) => {
      const lastPath = path?.[path.length - 1];
      const singleMessage = code === 'custom' ? msg : `${lastPath} is ${msg?.toLowerCase()}`;
      return `${acc}${acc ? '; ' : ''}${singleMessage}`;
    }, '');
  } else if (err.name === 'CastError') {
    type = 'Invalid ID';
    statusCode = BAD_REQUEST;
    message = `${(err as MongooseError.CastError).stringValue} is not a valid ID!`;
  } else if ('code' in err && err.code === 11000) {
    const match = err.message.match(/"([^"]*)"/);
    const extractedMessage = match && match[1];

    type = 'Duplicate Entry';
    statusCode = BAD_REQUEST;
    message = `${extractedMessage} is already exists`;
  } else if (err instanceof MongooseError.ValidationError) {
    type = 'Validation Error';
    statusCode = BAD_REQUEST;
    message = Object.values(err.errors).reduce((acc, { message: msg }) => {
      return `${acc}${acc ? '; ' : ''}${msg}.`;
    }, '');
  } else if (err instanceof AppError && err.statusCode === UNAUTHORIZED) {
    type = 'Unauthorized Access';
    statusCode = UNAUTHORIZED;
    message = err.message;
    errorDetails = null;
    stack = null;
  }
  return sendResponse(res, {
    success: false,
    statusCode,
    type,
    message,
    errorDetails: node_env === 'development' ? errorDetails : null,
    stack: node_env === 'development' ? stack : null,
  });
};

export default globalErrorHandler;
