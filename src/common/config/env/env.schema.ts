import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  API_VERSION: z.string().default('v1'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3000'),
  DATABASE_URL: z.url(),
  DATABASE_USERNAME: z.string().default('user'),
  DATABASE_PASSWORD: z.string().default('password'),
  DATABASE_NAME: z.string().default('mydatabase'),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z
    .string()
    .regex(/^\d+$/, 'DATABASE_PORT must be a number')
    .default('5433'),
  JWT_SECRET: z.string().default('pRGCzYn8byKBQoaAek109aZDf3xqUhlGia7uOLoCPwr'),
  JWT_ACCESS_TOKEN_EXP: z.string().default('30d'),
  JWT_REFRESH_TOKEN_EXP: z.string().default('1h'),
  NODE_MAILER_HOST: z.string().default('sandbox.smtp.mailtrap.io'),
  NODE_MAILER_PORT: z
    .string()
    .regex(/^\d+$/, 'NODE_MAILER_PORT must be a number')
    .default('2525'),
  NODE_MAILER_USER: z.string().default('04c1f3dc47ee7b'),
  NODE_MAILER_PASS: z.string().default('03ffee14e59857'),
  EMAIL_FROM: z.string().default('noreply@example.com'),
});
