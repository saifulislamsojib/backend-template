import type { Request, Response } from 'express';
import { z } from 'zod';
import validateRequest from './validateRequest';

describe('validateRequest middleware', () => {
  const res = {} as Response;
  const schema = z.object({ name: z.string(), age: z.number() });

  it('parses the request body and calls next when valid', async () => {
    const req = { body: { name: 'John', age: 30 } } as Request;
    const next = vi.fn();

    await validateRequest(schema)(req as never, res as never, next);

    expect(req.body).toStrictEqual({ name: 'John', age: 30 });
    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it('forwards validation errors to next', async () => {
    const req = { body: { name: 'John' } } as Request;
    const next = vi.fn();

    await validateRequest(schema)(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(z.ZodError);
  });
});
