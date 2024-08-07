import type { AuthUser } from '@/modules/auth/auth.types';
import type { EnvType } from '@/utils/catchEnvValidation';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
  namespace NodeJS {
    interface ProcessEnv extends EnvType {}
  }
}
