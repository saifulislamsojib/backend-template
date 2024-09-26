import logger from '@/configs/logger';
import sendResponse, { type TErrorResponse } from '@/utils/sendResponse';
import { RequestHandler } from 'express';
import { NOT_FOUND } from 'http-status';

/**
 * Not Found middleware that Handles all unhandled routes by sending a 404 status with a JSON response.
 *
 * @param _req - The express request object.
 * @param res - The express response object.
 */
const notFound: RequestHandler = (req, res) => {
  const errorResponse: TErrorResponse = {
    success: false,
    message: 'Requested Url Not Found!!',
    statusCode: NOT_FOUND,
    type: 'notFound',
  };
  logger.error({ url: req.url, method: req.method, ...errorResponse }, 'Route Not Found Error');

  return sendResponse(res, errorResponse);
};

export default notFound;
