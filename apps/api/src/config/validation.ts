import { z } from 'zod';

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth (JWT RS256)
  JWT_ACCESS_PRIVATE_KEY: z.string().min(1, 'JWT_ACCESS_PRIVATE_KEY is required (base64-encoded RSA private key)'),
  JWT_ACCESS_PUBLIC_KEY: z.string().min(1, 'JWT_ACCESS_PUBLIC_KEY is required (base64-encoded RSA public key)'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),

  // Twilio (optional in dev - features that need these will fail gracefully)
  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_PROXY_SERVICE_SID: z.string().optional().default(''),
  TWILIO_PHONE_NUMBER: z.string().optional().default(''),
  TWILIO_WHATSAPP_NUMBER: z.string().optional().default(''),
  TWILIO_TWIML_APP_SID: z.string().optional().default(''),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional().default(''),
  TWILIO_API_KEY_SID: z.string().optional().default(''),
  TWILIO_API_KEY_SECRET: z.string().optional().default(''),

  // Resend (Email - optional in dev)
  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM_EMAIL: z.string().optional().default('noreply@scan2call.com.au'),

  // Google OAuth (optional in dev)
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().optional().default(''),

  // Facebook OAuth (optional in dev)
  FACEBOOK_APP_ID: z.string().optional().default(''),
  FACEBOOK_APP_SECRET: z.string().optional().default(''),
  FACEBOOK_CALLBACK_URL: z.string().optional().default(''),

  // Stripe (optional in dev)
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  STRIPE_SUBSCRIPTION_PRICE_ID: z.string().optional().default(''),

  // S3-Compatible Storage (optional in dev)
  S3_BUCKET: z.string().optional().default('scan2call-media'),
  S3_REGION: z.string().default('ap-southeast-2'),
  S3_ENDPOINT: z.string().optional().default(''),
  S3_ACCESS_KEY_ID: z.string().optional().default(''),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(''),
  CDN_URL: z.string().optional().default(''),

  // Captcha (optional in dev)
  TURNSTILE_SECRET_KEY: z.string().optional().default(''),

  // App
  APP_URL: z.string().url('APP_URL must be a valid URL'),
  API_URL: z.string().url('API_URL must be a valid URL'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Redis
  REDIS_URL: z.string().optional().default(''),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables at startup.
 * Throws a descriptive error if any required vars are missing or invalid.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data;
}
