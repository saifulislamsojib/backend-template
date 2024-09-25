import { RequestHandler } from 'express';
import { NOT_FOUND } from 'http-status';

/**
 * Not Found middleware that Handles all unhandled routes by sending a 404 status with a JSON response.
 *
 * @param _req - The express request object.
 * @param res - The express response object.
 */
const notFound: RequestHandler = (_req, res) => {
  return res.status(NOT_FOUND).json({
    success: false,
    message: 'Requested Url Not Found!!',
  });
};

export default notFound;
