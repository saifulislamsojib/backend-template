import configs from '@/configs';
import logger from '@/configs/logger';
import AppError from '@/errors/AppError';
import { ERROR_TYPE, type ErrorType } from '@/errors/error.const';
import sendResponse, { type TErrorResponse } from '@/utils/sendResponse';
import type { ErrorRequestHandler } from 'express';
import status from 'http-status';
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
const globalErrorHandler: ErrorRequestHandler = (err: Error, req, res, next) => {
  if (res.headersSent) {
    return next('Something went wrong!');
  }
  let statusCode = err instanceof AppError ? err.statusCode : status.INTERNAL_SERVER_ERROR;
  let type: ErrorType = err instanceof AppError ? ERROR_TYPE.appError : ERROR_TYPE.serverError;
  let message = err.message || 'Something went wrong!';

  if (err instanceof ZodError) {
    type = ERROR_TYPE.validationError;
    statusCode = status.BAD_REQUEST;
    message = err.issues.reduce((acc, { path, message: msg, code }) => {
      const lastPath = path?.[path.length - 1];
      const singleMessage = code === 'custom' ? msg : `${lastPath} is ${msg?.toLowerCase()}`;
      return `${acc}${acc ? '; ' : ''}${singleMessage}`;
    }, '');
  } else if (err.name === 'CastError') {
    type = ERROR_TYPE.castError;
    statusCode = status.BAD_REQUEST;
    message = `${(err as MongooseError.CastError).stringValue} is not a valid ID!`;
  } else if ('code' in err && err.code === 11000) {
    type = ERROR_TYPE.duplicateEntry;
    statusCode = status.BAD_REQUEST;
    const match = err.message.match(/"([^"]*)"/);
    const extractedMessage = match && match[1];
    message = `${extractedMessage} is already exists`;
  } else if (err instanceof MongooseError.ValidationError) {
    type = ERROR_TYPE.validationError;
    statusCode = status.BAD_REQUEST;
    message = Object.values(err.errors).reduce((acc, { message: msg }) => {
      return `${acc}${acc ? '; ' : ''}${msg}.`;
    }, '');
  } else if (err instanceof AppError && err.statusCode === status.UNAUTHORIZED) {
    type = ERROR_TYPE.unauthorized;
    statusCode = status.UNAUTHORIZED;
  } else if (err instanceof AppError && err.statusCode === status.NOT_FOUND) {
    type = ERROR_TYPE.notFound;
    statusCode = status.NOT_FOUND;
  }

  const errorResponse: TErrorResponse = { success: false, statusCode, type, message };

  if (configs.node_env === 'development') errorResponse.stack = err.stack;

  const logResponse = {
    url: req.url,
    method: req.method,
    userId: req.user?._id,
    userEmail: req.user?.email,
    ...errorResponse,
  };
  if (statusCode === status.INTERNAL_SERVER_ERROR) {
    logger.fatal(logResponse, 'Global Error');
  } else {
    logger.error(logResponse, 'Global Error');
  }

  return sendResponse(res, errorResponse);
};

export default globalErrorHandler;
