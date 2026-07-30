import AppError from '@/errors/AppError';
import type { Request, Response } from 'express';
import { status } from 'http-status';
import { createRateLimiter } from './rateLimiter';

describe('rateLimiter middleware', () => {
  it('should allow requests within limit and pass AppError to next() when limit is exceeded', async () => {
    const limiter = createRateLimiter({
      windowMs: 60 * 1000,
      limit: 2,
      skipInTest: false,
    });

    const mockReq = {
      ip: '127.0.0.1',
      headers: {},
      app: { get: () => undefined },
    } as unknown as Request;
    const mockRes = {
      setHeader: vi.fn(),
      getHeader: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    // 1st request
    await limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenLastCalledWith();

    // 2nd request
    await limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenLastCalledWith();

    // 3rd request - passes AppError to next()
    await limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenLastCalledWith(expect.any(AppError));
    const err = next.mock.calls[2]?.[0] as AppError;
    expect(err.statusCode).toBe(status.TOO_MANY_REQUESTS);
  });
});
