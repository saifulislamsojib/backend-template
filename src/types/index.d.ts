import { AuthUser } from '@/modules/auth/auth.types';
import { EnvType } from '@/utils/catchEnvValidation';

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
