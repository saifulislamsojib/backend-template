import { type ZodError, z } from 'zod';

const node_envs = ['development', 'test', 'staging', 'production'] as const;

const envValidationSchema = z.object({
  NODE_ENV: z.enum(node_envs),
  DB_URI: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string(),
  CLIENT_ORIGIN: z.string().optional(),
  PORT: z
    .string()
    .optional()
    .refine((port) => (port ? parseInt(port, 10) > 0 : true), {
      message: 'PORT must be a positive integer.',
    }),
  BCRYPT_SALT_ROUNDS: z.string().refine((val) => parseInt(val, 10) > 0, {
    message: 'BCRYPT_SALT_ROUNDS must be a positive number.',
  }),
});

export type EnvType = z.infer<typeof envValidationSchema>;

/**
 * This function validates the environment variables of the current process.
 * If any of the required environment variables are missing or invalid,
 * this function will log the error and exit the process with code 1.
 */
const catchEnvValidation = async () => {
  try {
    await envValidationSchema.parseAsync(process.env);
  } catch (error) {
    console.log('Env validation error =', (error as ZodError).errors);
    process.exit(1);
  }
};

export default catchEnvValidation;
