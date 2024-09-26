import type { ErrorType } from '@/errors/const.error';
import type { Response } from 'express';

export type TSuccessResponse<T extends object, U extends object> = {
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

export type TResponse<T extends object, U extends object> = TSuccessResponse<T, U> | TErrorResponse;

const sendResponse = <T extends object, U extends object>(res: Response, data: TResponse<T, U>) => {
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
  return res.status(data.statusCode).json(response);
};

export default sendResponse;
