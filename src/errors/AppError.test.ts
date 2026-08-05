import AppError from './AppError';

describe('AppError', () => {
  it('extends Error with a status code and message', () => {
    const error = new AppError(404, 'Not found');

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
  });

  it('captures a stack trace by default', () => {
    const error = new AppError(500, 'Server error');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });

  it('uses the provided stack when given', () => {
    const error = new AppError(400, 'Bad request', 'custom stack');

    expect(error.stack).toBe('custom stack');
  });

  it('removes the stack when null is provided', () => {
    const error = new AppError(400, 'Bad request', null);

    expect(error.stack).toBeUndefined();
  });
});
