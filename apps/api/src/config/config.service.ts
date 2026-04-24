import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import type { EnvConfig } from './validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: NestConfigService<EnvConfig, true>) {}

  // ── Database ──────────────────────────────────
  get databaseUrl(): string {
    return this.config.get('DATABASE_URL');
  }

  // ── JWT ───────────────────────────────────────
  get jwtAccessPrivateKey(): string {
    return this.config.get('JWT_ACCESS_PRIVATE_KEY');
  }

  get jwtAccessPublicKey(): string {
    return this.config.get('JWT_ACCESS_PUBLIC_KEY');
  }

  get jwtRefreshSecret(): string {
    return this.config.get('JWT_REFRESH_SECRET');
  }

  // ── Twilio ────────────────────────────────────
  get twilioAccountSid(): string {
    return this.config.get('TWILIO_ACCOUNT_SID');
  }

  get twilioAuthToken(): string {
    return this.config.get('TWILIO_AUTH_TOKEN');
  }

  get twilioProxyServiceSid(): string {
    return this.config.get('TWILIO_PROXY_SERVICE_SID');
  }

  get twilioPhoneNumber(): string {
    return this.config.get('TWILIO_PHONE_NUMBER');
  }

  get twilioWhatsAppNumber(): string {
    return this.config.get('TWILIO_WHATSAPP_NUMBER');
  }

  get twilioTwimlAppSid(): string {
    return this.config.get('TWILIO_TWIML_APP_SID');
  }

  get twilioVerifyServiceSid(): string {
    return this.config.get('TWILIO_VERIFY_SERVICE_SID');
  }

  // ── Resend (Email) ──────────────────────────
  get resendApiKey(): string {
    return this.config.get('RESEND_API_KEY');
  }

  get resendFromEmail(): string {
    return this.config.get('RESEND_FROM_EMAIL');
  }

  // ── Google OAuth ────────────────────────────
  get googleClientId(): string {
    return this.config.get('GOOGLE_CLIENT_ID');
  }

  get googleClientSecret(): string {
    return this.config.get('GOOGLE_CLIENT_SECRET');
  }

  get googleCallbackUrl(): string {
    return this.config.get('GOOGLE_CALLBACK_URL');
  }

  // ── Facebook OAuth ─────────────────────────
  get facebookAppId(): string {
    return this.config.get('FACEBOOK_APP_ID');
  }

  get facebookAppSecret(): string {
    return this.config.get('FACEBOOK_APP_SECRET');
  }

  get facebookCallbackUrl(): string {
    return this.config.get('FACEBOOK_CALLBACK_URL');
  }

  // ── Stripe ────────────────────────────────────
  get stripeSecretKey(): string {
    return this.config.get('STRIPE_SECRET_KEY');
  }

  get stripePublishableKey(): string {
    return this.config.get('STRIPE_PUBLISHABLE_KEY');
  }

  get stripeWebhookSecret(): string {
    return this.config.get('STRIPE_WEBHOOK_SECRET');
  }

  get stripeSubscriptionPriceId(): string {
    return this.config.get('STRIPE_SUBSCRIPTION_PRICE_ID');
  }

  // ── S3 / R2 ───────────────────────────────────
  get s3Bucket(): string {
    return this.config.get('S3_BUCKET');
  }

  get s3Region(): string {
    return this.config.get('S3_REGION');
  }

  get s3Endpoint(): string {
    return this.config.get('S3_ENDPOINT');
  }

  get s3AccessKeyId(): string {
    return this.config.get('S3_ACCESS_KEY_ID');
  }

  get s3SecretAccessKey(): string {
    return this.config.get('S3_SECRET_ACCESS_KEY');
  }

  get cdnUrl(): string {
    return this.config.get('CDN_URL');
  }

  // ── Captcha ──────────────────────────────────
  get turnstileSecretKey(): string {
    return this.config.get('TURNSTILE_SECRET_KEY');
  }

  // ── App ───────────────────────────────────────
  get appUrl(): string {
    return this.config.get('APP_URL');
  }

  get apiUrl(): string {
    return this.config.get('API_URL');
  }

  get apiPort(): number {
    return this.config.get('API_PORT');
  }

  get nodeEnv(): string {
    return this.config.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  // ── Redis ─────────────────────────────────────
  get redisUrl(): string {
    return this.config.get('REDIS_URL');
  }
}
