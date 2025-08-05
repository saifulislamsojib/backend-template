import type { AuthUser } from '@/modules/auth/auth.types.js';
import type { EnvType } from '@/utils/catchEnvValidation.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
  namespace NodeJS {
    interface ProcessEnv extends EnvType {
      [key: string]: string | undefined;
    }
  }

  type AnyObject = Record<string, unknown>;
  type Params = Record<string, string | undefined>;
}
