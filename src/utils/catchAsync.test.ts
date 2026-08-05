import catchAsync from './catchAsync';

describe('catchAsync', () => {
  const req = {} as never;
  const res = {} as never;

  it('runs the handler and does not call next when it resolves', async () => {
    const next = vi.fn();
    const handler = vi.fn().mockResolvedValue(undefined);
    const wrapped = catchAsync(handler);

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards errors thrown synchronously to next', async () => {
    const next = vi.fn();
    const error = new Error('sync boom');
    const wrapped = catchAsync(() => {
      throw error;
    });

    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledExactlyOnceWith(error);
  });

  it('forwards async rejections to next', async () => {
    const next = vi.fn();
    const error = new Error('async boom');
    const wrapped = catchAsync(() => Promise.reject(error));

    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledExactlyOnceWith(error);
  });
});
