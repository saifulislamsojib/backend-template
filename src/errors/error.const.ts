export const ERROR_TYPE = Object.freeze({
  validationError: 'validationError',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  duplicateEntry: 'duplicateEntry', // throw by mongoose
  castError: 'castError', // throw by mongoose
  notFound: 'notFound',
  appError: 'appError',
  serverError: 'serverError',
});

export type ErrorType = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE];
