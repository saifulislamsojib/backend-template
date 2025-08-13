import logger from '@/configs/logger';
import sendResponse, { type TErrorResponse } from '@/utils/sendResponse';
import type { RequestHandler } from 'express';
import { status } from 'http-status';

const notFoundResponse: TErrorResponse = {
  success: false,
  message: 'Requested Url Not Found!!',
  statusCode: status.NOT_FOUND,
  type: 'notFound',
};

/**
 * Not Found middleware that Handles all unhandled routes by sending a 404 status with a JSON response.
 * @param _req - The express request object.
 * @param res - The express response object.
 */
const notFound: RequestHandler = (req, res) => {
  logger.error({ url: req.url, method: req.method, ...notFoundResponse }, 'Route Not Found Error');

  return sendResponse(res, notFoundResponse);
};

export default notFound;
