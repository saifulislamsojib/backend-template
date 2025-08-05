import type { ErrorType } from '@/errors/error.const.js';
import type { Response } from 'express';

type ResponseData = AnyObject | unknown[];

export type TSuccessResponse<T extends ResponseData, U extends AnyObject = AnyObject> = {
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

export type TResponse<T extends ResponseData, U extends AnyObject> =
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
const sendResponse = <T extends ResponseData, U extends AnyObject>(
  res: Pick<Response, 'status'>,
  data: TResponse<T, U>,
) => {
  const response = {
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
  } as TResponse<T, U>;
  if (data.success && response.success) {
    response.data = data.data;
    if (data.meta) {
      response.meta = data.meta;
    }
  }
  if (!data.success && !response.success) {
    response.type = data.type;
    if (data.error) response.error = data.error;
    if (data.stack) response.stack = data.stack;
  }
  res.status(data.statusCode).json(response);
};

export default sendResponse;
