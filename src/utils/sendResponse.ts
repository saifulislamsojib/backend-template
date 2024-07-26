import type { Response } from 'express';

type TResponse<T extends object, U extends object> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: U;
};

const sendResponse = <T extends object, U extends object>(res: Response, data: TResponse<T, U>) => {
  const response: TResponse<T, U> = {
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
  };
  if (data.meta) {
    response.meta = data.meta;
  }
  return res.status(data.statusCode).json(response);
};

export default sendResponse;
