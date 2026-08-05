import type { AuthPayload } from '@/modules/auth/auth.types';
import AppError from '@/errors/AppError';
import type { Request, Response } from 'express';
import { status } from 'http-status';
import authCheck from './authCheck';

const mocks = vi.hoisted(() => ({
  isAppKeyValid: vi.fn(),
  verifyJWT: vi.fn(),
  findById: vi.fn(),
}));

vi.mock('@/modules/auth/auth.utils', () => ({
  AUTH_TOKEN_KEY: 'access-token',
  isAppKeyValid: mocks.isAppKeyValid,
  verifyJWT: mocks.verifyJWT,
}));

vi.mock('@/modules/user/user.model', () => ({ default: { findById: mocks.findById } }));

describe('authCheck middleware', () => {
  const res = {} as Response;

  const payload: AuthPayload = {
    _id: '507f1f77bcf86cd799439011',
    email: 'john@example.com',
    role: 'user',
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const userDoc = {
    _id: payload._id,
    email: payload.email,
    role: payload.role,
    name: 'John',
    createdAt: new Date(),
    updatedAt: new Date(),
    passwordUpdatedAt: undefined,
  };

  const mockUserQuery = (user: AnyObject | null) => {
    mocks.findById.mockReturnValue({ select: () => ({ lean: () => user }) });
  };

  const makeReq = (overrides: AnyObject = {}) =>
    ({ cookies: {}, get: vi.fn(), ...overrides }) as unknown as Request;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws UNAUTHORIZED when no authorization is present', async () => {
    mocks.isAppKeyValid.mockReturnValue(true);
    const req = makeReq({ get: vi.fn().mockReturnValue(undefined) });
    const next = vi.fn();

    await authCheck()(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    const err = next.mock.calls[0]?.[0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(status.UNAUTHORIZED);
    expect(err.message).toBe('Invalid token!');
  });

  it('throws UNAUTHORIZED when no cookie token is present', async () => {
    mocks.isAppKeyValid.mockReturnValue(false);
    const req = makeReq();
    const next = vi.fn();

    await authCheck()(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect((next.mock.calls[0]?.[0] as AppError).statusCode).toBe(status.UNAUTHORIZED);
  });

  it('throws UNAUTHORIZED when the token cannot be verified', async () => {
    mocks.isAppKeyValid.mockReturnValue(true);
    mocks.verifyJWT.mockImplementation(() => {
      throw new AppError(status.UNAUTHORIZED, 'Invalid token!');
    });
    const req = makeReq({ get: vi.fn().mockReturnValue('Bearer abc') });
    const next = vi.fn();

    await authCheck()(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect((next.mock.calls[0]?.[0] as AppError).statusCode).toBe(status.UNAUTHORIZED);
  });

  it('throws UNAUTHORIZED when the user does not exist', async () => {
    mocks.isAppKeyValid.mockReturnValue(true);
    mocks.verifyJWT.mockReturnValue(payload);
    mockUserQuery(null);
    const req = makeReq({ get: vi.fn().mockReturnValue('Bearer token') });
    const next = vi.fn();

    await authCheck()(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect((next.mock.calls[0]?.[0] as AppError).statusCode).toBe(status.UNAUTHORIZED);
  });

  it('throws UNAUTHORIZED when the password was changed after the token was issued', async () => {
    mocks.isAppKeyValid.mockReturnValue(true);
    mocks.verifyJWT.mockReturnValue(payload);
    mockUserQuery({ ...userDoc, passwordUpdatedAt: new Date((payload.iat! + 10) * 1000) });
    const req = makeReq({ get: vi.fn().mockReturnValue('Bearer token') });
    const next = vi.fn();

    await authCheck()(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect((next.mock.calls[0]?.[0] as AppError).statusCode).toBe(status.UNAUTHORIZED);
  });

  it('throws UNAUTHORIZED when the email does not match the token', async () => {
    mocks.isAppKeyValid.mockReturnValue(true);
    mocks.verifyJWT.mockReturnValue(payload);
    mockUserQuery({ ...userDoc, email: 'changed@example.com' });
    const req = makeReq({ get: vi.fn().mockReturnValue('Bearer token') });
    const next = vi.fn();

    await authCheck()(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect((next.mock.calls[0]?.[0] as AppError).statusCode).toBe(status.UNAUTHORIZED);
  });

  it('throws UNAUTHORIZED when the role does not match the token', async () => {
    mocks.isAppKeyValid.mockReturnValue(true);
    mocks.verifyJWT.mockReturnValue(payload);
    mockUserQuery({ ...userDoc, role: 'admin' });
    const req = makeReq({ get: vi.fn().mockReturnValue('Bearer token') });
    const next = vi.fn();

    await authCheck()(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect((next.mock.calls[0]?.[0] as AppError).statusCode).toBe(status.UNAUTHORIZED);
  });

  it('throws FORBIDDEN when the user role is not allowed', async () => {
    mocks.isAppKeyValid.mockReturnValue(true);
    mocks.verifyJWT.mockReturnValue(payload);
    mockUserQuery(userDoc);
    const req = makeReq({ get: vi.fn().mockReturnValue('Bearer token') });
    const next = vi.fn();

    await authCheck('admin')(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    const err = next.mock.calls[0]?.[0] as AppError;
    expect(err.statusCode).toBe(status.FORBIDDEN);
    expect(err.message).toMatch(/permissions/i);
  });

  it('sets req.user and calls next for a valid token', async () => {
    mocks.isAppKeyValid.mockReturnValue(true);
    mocks.verifyJWT.mockReturnValue(payload);
    mockUserQuery(userDoc);
    const req = makeReq({ get: vi.fn().mockReturnValue('Bearer token') });
    const next = vi.fn();

    await authCheck('user')(req as never, res as never, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.findById).toHaveBeenCalledWith(payload._id);
    expect(req.user).toMatchObject({
      _id: payload._id,
      name: 'John',
      email: payload.email,
      role: 'user',
    });
  });
});
