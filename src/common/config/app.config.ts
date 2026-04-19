import z from 'zod';

// not env variables, but other app-level config that might be needed in the future
export const appConfigSchema = z.object({
  emailValidationSecretExpiration: z.number().default(30 * 60 * 1000), // how long the email verification secret is valid for in hours
  emailValidationSecretExpirationMinutes: z.string().default(''), // how long the email verification secret is valid for in hours
});

export const AppConfig: z.infer<typeof appConfigSchema> = appConfigSchema.parse(
  {
    emailValidationSecretExpiration: 30 * 60 * 1000, // 30 minutes
    emailValidationSecretExpirationMinutes: '30',
  },
);
