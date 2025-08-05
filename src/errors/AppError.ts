class AppError extends Error {
  statusCode: number;

  /**
   * Constructor for AppError.
   *
   * @param statusCode - The HTTP status code associated with the error.
   * @param message - The error message.
   * @param stack - The error stack trace. If not provided, it will be automatically captured. If provided as null, the stack will be undefined. Otherwise, it will be set to the provided string.
   */
  constructor(statusCode: number, message: string, stack?: string | null) {
    super(message);
    this.statusCode = statusCode;

    if (stack) {
      this.stack = stack;
    } else if (stack === null) {
      delete this.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
