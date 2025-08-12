import logger from '#configs/logger';
import { z, type ZodError } from 'zod';

const node_envs = ['development', 'test', 'staging', 'production'] as const;
const log_levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;

const envValidationSchema = z.object({
  NODE_ENV: z.enum(node_envs),
  DB_URI: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string(),
  CLIENT_ORIGIN: z.url(),
  LOG_LEVEL: z.enum(log_levels).optional(),
  IS_LOGS_ON_FILE: z.enum(['true', 'false']).optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  PORT: z
    .string()
    .optional()
    .refine((port) => (port ? parseInt(port, 10) > 0 : true), {
      error: 'PORT must be a positive integer.',
    }),
  BCRYPT_SALT_ROUNDS: z.string().refine((val) => parseInt(val, 10) > 0, {
    error: 'BCRYPT_SALT_ROUNDS must be a positive number.',
  }),
});

type EnvType = z.infer<typeof envValidationSchema>;

/**
 * This function validates the environment variables of the current process.
 * If any of the required environment variables are missing or invalid,
 * this function will log the error and exit the process with code 1.
 */
const catchEnvValidation = async () => {
  try {
    await envValidationSchema.parseAsync(process.env);
    return true;
  } catch (error) {
    const err = (error as ZodError).issues.reduce(
      (acc, cur) => {
        const path = cur.path[0];
        if (path) {
          acc[path as keyof EnvType] = cur.message;
          return acc;
        }
        return acc;
      },
      {} as Record<Partial<keyof EnvType>, string>,
    );
    logger.fatal(err, 'Environment Variable validation error');
    setTimeout(() => {
      process.exit(1);
    }, 100);
    return false;
  }
};

export type { EnvType };
export default catchEnvValidation;
