import { RequestHandler } from 'express';
import { NOT_FOUND } from 'http-status';

const notFound: RequestHandler = (_req, res) => {
  return res.status(NOT_FOUND).json({
    success: false,
    message: 'Requested Url Not Found!!',
  });
};

export default notFound;
