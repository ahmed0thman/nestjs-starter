import 'dotenv/config';
import { envSchema } from './env.schema';
import { z } from 'zod';

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

export type EnvT = z.infer<typeof envSchema>;
