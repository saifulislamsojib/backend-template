class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string, stack?: string | null) {
    super(message);
    this.statusCode = statusCode;

    if (stack) {
      this.stack = stack;
    } else if (stack === null) {
      this.stack = undefined;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
