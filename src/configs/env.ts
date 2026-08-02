import { prettifyError, z } from 'zod';

const node_envs = ['development', 'test', 'staging', 'production'] as const;
const log_levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;
const upload_storage_drivers = ['local', 's3'] as const;

const envValidationSchema = z.object({
  NODE_ENV: z.enum(node_envs).default('development'),
  DB_URI: z.url().trim(),
  APP_KEY: z.string().trim().min(8),
  JWT_ACCESS_SECRET: z.string().trim().min(10),
  JWT_ACCESS_EXPIRES_IN_MINUTES: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10080)), // 7 days in minutes
  CLIENT_ORIGIN: z.url().trim(),
  LOG_LEVEL: z.enum(log_levels).default('info'),
  IS_LOGS_ON_FILE: z.enum(['true', 'false']).default('false'),
  REDIS_HOST: z.string().trim().default('localhost'),
  REDIS_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 6379)),
  PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 8080)),
  BCRYPT_SALT_ROUNDS: z.string().transform((val) => parseInt(val, 10)),
  REDIS_CACHE_REVALIDATE_TIME_IN_SECONDS: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 86400)), // Default is 24 hours
  UPLOAD_STORAGE_DRIVER: z.enum(upload_storage_drivers).default('local'),
  UPLOAD_LOCAL_DIRECTORY: z.string().trim().min(1).default('.data/uploads'),
  UPLOAD_MAX_FILE_SIZE_BYTES: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 2 * 1024 * 1024))
    .pipe(z.number().int().positive()),
  UPLOAD_S3_BUCKET: z.string().trim().min(1).optional(),
  UPLOAD_S3_REGION: z.string().trim().min(1).optional(),
  UPLOAD_S3_ENDPOINT: z.url().trim().optional(),
  UPLOAD_S3_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
  UPLOAD_S3_SECRET_ACCESS_KEY: z.string().trim().min(1).optional(),
  UPLOAD_S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
});

const { error, data } = envValidationSchema.safeParse(process.env);

if (!data) {
  console.error(prettifyError(error), 'Environment Variable validation error');
  process.exit(1);
}

export default Object.freeze(data);
