import type { AuthUser } from '@/modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }

  type AnyObject = Record<string, unknown>;
  type Params = Record<string, string | undefined>;
}
