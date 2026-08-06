import { z } from 'zod';
import type { StringValue } from 'ms';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  API_VERSION: z.string().default('v1'),
  APP_NAME: z.string().default('nestjs-starter'),
  APP_URL: z.string().default('http://localhost:3000'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3000'),
  // Database configuration
  DATABASE_URL: z.url(),
  DATABASE_USERNAME: z.string().default('user'),
  DATABASE_PASSWORD: z.string().default('password'),
  DATABASE_NAME: z.string().default('mydatabase'),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z
    .string()
    .regex(/^\d+$/, 'DATABASE_PORT must be a number')
    .default('5433'),
  // Redis configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .regex(/^\d+$/, 'REDIS_PORT must be a number')
    .default('6378'),
  REDIS_PASSWORD: z.string().default('redis-strong-password'),
  REDIS_TTL: z.int().positive().default(60000), // default TTL for cache in milliseconds (1 minute)
  // Authentication configuration
  JWT_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXP: z.custom<StringValue>().default('30m'),
  JWT_REFRESH_TOKEN_EXP: z.custom<StringValue>().default('7d'), // as we well use refresh token rotation, we can set a short expiration time for refresh tokens
  FAKE_PASSWORD: z.string().default('fakepassword'),
  FAKE_HASHED_PASSWORD: z
    .string()
    .default(
      '$argon2id$v=19$m=65536,t=3,p=4$Z3Vlc3R1c2VyLXNlbHRlZC1oYXNo$Z3Vlc3R1c2VyLXNlbHRlZC1oYXNo',
    ),
  MaxFailedLoginAttempts: z.number().positive().gt(0).default(3),
  LockOutDurationMinutes: z.number().positive().gt(0).default(15),
  // Email Service configuration
  NODE_MAILER_HOST: z.string(),
  NODE_MAILER_PORT: z
    .string()
    .regex(/^\d+$/, 'NODE_MAILER_PORT must be a number'),
  NODE_MAILER_USER: z.string(),
  NODE_MAILER_PASS: z.string(),
  EMAIL_FROM: z.string().default('noreply@example.com'),
});
