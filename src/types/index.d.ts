import { EnvType } from '@/utils/catchEnvValidation';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
  namespace NodeJS {
    interface ProcessEnv extends EnvType {}
  }
}
