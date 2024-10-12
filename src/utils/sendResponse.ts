import type { ErrorType } from '@/errors/error.const';
import type { Response } from 'express';

export type TSuccessResponse<T extends AnyObject, U extends AnyObject> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: U;
};

export type TErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
  type: ErrorType;
  error?: Error;
  stack?: string;
};

export type TResponse<T extends AnyObject, U extends AnyObject> =
  | TSuccessResponse<T, U>
  | TErrorResponse;

/**
 * A helper function to send a JSON response to the request.
 *
 * It takes the express response object and the data that needs to be sent.
 * It will construct the response object according to the type of data.
 * If data.success is true, it will add the data to the response object.
 * If data.success is false, it will add the type, error, and stack to the response object.
 *
 * @param res - the express response object
 * @param {} data - the data that needs to be sent
 * @return the express response object
 */
const sendResponse = <T extends AnyObject, U extends AnyObject>(
  res: Response,
  data: TResponse<T, U>,
) => {
  const response = {
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
  } as TResponse<T, U>;
  if (data.success === true && response.success === true) {
    response.data = data.data;
    if (data.meta) {
      response.meta = data.meta;
    }
  }
  if (data.success === false && response.success === false) {
    response.type = data.type;
    response.error = data.error;
    response.stack = data.stack;
  }
  res.status(data.statusCode).json(response);
};

export default sendResponse;
