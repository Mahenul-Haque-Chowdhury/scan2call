import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Resend } from 'resend';
import * as twilio from 'twilio';
import { AppConfigService } from '../config/config.service';

interface ScanNotificationPayload {
  ownerEmail: string;
  ownerPhone?: string;
  ownerFirstName: string;
  tagLabel: string | null;
  tagToken: string;
  scanCity?: string;
  scanCountry?: string;
  scannedAt: Date;
}

interface OrderConfirmationPayload {
  email: string;
  firstName: string;
  orderNumber: string;
  totalInCents: number;
  items: { name: string; quantity: number; priceInCents: number }[];
}

interface ContactFormPayload {
  name: string;
  email: string;
  message: string;
}

interface ItemFoundPayload {
  ownerEmail: string;
  ownerFirstName: string;
  tagLabel: string | null;
  tagToken: string;
  finderMessage?: string;
  finderImageUrl?: string;
}

interface DeliveryOptions {
  critical?: boolean;
  context?: string;
}

interface EmailTemplateOptions {
  eyebrow?: string;
  title: string;
  intro: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  note?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private readonly twilioClient: twilio.Twilio | null;
  private readonly twilioVerifyServiceSid: string;

  constructor(private readonly configService: AppConfigService) {
    const apiKey = this.configService.resendApiKey;
    this.resend = apiKey ? new Resend(apiKey) : null;

    const twilioSid = this.configService.twilioAccountSid;
    const twilioToken = this.configService.twilioAuthToken;
    this.twilioVerifyServiceSid = this.configService.twilioVerifyServiceSid;

    if (twilioSid && twilioToken) {
      this.twilioClient = twilio.default(twilioSid, twilioToken);
    } else {
      this.twilioClient = null;
    }
  }

  private handleCriticalFailure(message: string, error?: unknown): never {
    if (error) {
      this.logger.error(message, error instanceof Error ? error.stack : String(error));
    } else {
      this.logger.error(message);
    }

    throw new ServiceUnavailableException(message);
  }

  /**
   * Low-level email helper. Logs in dev mode, sends via Resend in production.
   * Non-critical notification failures are logged and swallowed.
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    options: DeliveryOptions = {},
  ): Promise<void> {
    const contextLabel = options.context || 'email';

    try {
      if (!this.resend) {
        if (options.critical && this.configService.isProduction) {
          this.handleCriticalFailure(`Resend is not configured for ${contextLabel}.`);
        }

        this.logger.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
        this.logger.log(`[DEV EMAIL] Body:\n${html}`);
        return;
      }

      await this.resend.emails.send({
        from: this.configService.resendFromEmail,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: "${subject}"`);
    } catch (error) {
      if (options.critical && this.configService.isProduction) {
        this.handleCriticalFailure(`Failed to send ${contextLabel}.`, error);
      }

      this.logger.error(`Failed to send email to ${to}: ${error}`);
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private renderEmailTemplate(options: EmailTemplateOptions): string {
    const eyebrowHtml = options.eyebrow
      ? `<p style="margin: 0 0 12px; color: #facc15; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;">${options.eyebrow}</p>`
      : '';

    const ctaHtml = options.ctaLabel && options.ctaUrl
      ? `
          <div style="text-align: center; margin: 32px 0 0;">
            <a href="${options.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #facc15 0%, #fde68a 100%); color: #0c0a09; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 999px; box-shadow: 0 12px 30px rgba(250, 204, 21, 0.18);">
              ${options.ctaLabel}
            </a>
          </div>
        `
      : '';

    const noteHtml = options.note
      ? `<p style="margin: 24px 0 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">${options.note}</p>`
      : '';

    return `
      <div style="margin: 0; padding: 32px 16px; background-color: #0a0a0a; background-image: radial-gradient(circle at top left, rgba(250, 204, 21, 0.12), transparent 32%), radial-gradient(circle at bottom right, rgba(124, 196, 250, 0.10), transparent 36%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #fafafa;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="margin-bottom: 18px; text-align: center; color: #facc15; font-size: 28px; font-weight: 800; letter-spacing: -0.03em;">
            Scan2Call
          </div>
          <div style="border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 36px 30px; background: rgba(20, 20, 20, 0.92); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);">
            ${eyebrowHtml}
            <h1 style="margin: 0 0 16px; color: #fafafa; font-size: 30px; line-height: 1.15; font-weight: 800; letter-spacing: -0.03em;">${options.title}</h1>
            <p style="margin: 0 0 16px; color: #d4d4d8; font-size: 16px; line-height: 1.75;">${options.intro}</p>
            <div style="margin-top: 20px; padding: 18px 20px; border-radius: 18px; background: rgba(250, 204, 21, 0.08); border: 1px solid rgba(250, 204, 21, 0.16); color: #e4e4e7; font-size: 15px; line-height: 1.75;">
              ${options.body}
            </div>
            ${ctaHtml}
            ${noteHtml}
          </div>
          <p style="margin: 18px 0 0; text-align: center; color: #71717a; font-size: 12px; line-height: 1.6;">
            Privacy-first QR identity tags with secure contact relay.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Send email verification link to a new user.
   */
  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService.appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    const escapedFirstName = this.escapeHtml(firstName);
    const html = this.renderEmailTemplate({
      eyebrow: 'Account Security',
      title: `Verify your email, ${escapedFirstName}`,
      intro: 'Thanks for creating your Scan2Call account. Confirm your email address to unlock account access and keep your recovery options secure.',
      body: 'Click the button below to verify your email. This verification link expires in 24 hours. If you did not create an account, you can safely ignore this email.',
      ctaLabel: 'Verify Email',
      ctaUrl: verifyUrl,
      note: 'Scan2Call protects your identity with privacy-first QR tags and controlled contact relay.',
    });

    await this.sendEmail(email, 'Verify your Scan2Call email', html, {
      critical: true,
      context: 'email verification email',
    });
  }

  /**
   * Send password reset link.
   */
  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.appUrl}/reset-password?token=${token}`;

    const escapedFirstName = this.escapeHtml(firstName);
    const html = this.renderEmailTemplate({
      eyebrow: 'Account Recovery',
      title: `Reset your password, ${escapedFirstName}`,
      intro: 'We received a request to reset your Scan2Call password.',
      body: 'Use the button below to choose a new password. This reset link expires in 1 hour. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.',
      ctaLabel: 'Reset Password',
      ctaUrl: resetUrl,
      note: 'If you continue having trouble accessing your account, contact Scan2Call Support.',
    });

    await this.sendEmail(email, 'Reset your Scan2Call password', html, {
      critical: true,
      context: 'password reset email',
    });
  }

  async sendSocialWelcomeEmail(email: string, firstName: string, provider: 'Google' | 'Facebook'): Promise<void> {
    const escapedFirstName = this.escapeHtml(firstName);
    const dashboardUrl = `${this.configService.appUrl}/dashboard`;
    const html = this.renderEmailTemplate({
      eyebrow: `${provider} Sign-In`,
      title: `Welcome to Scan2Call, ${escapedFirstName}`,
      intro: `Your account is now active with ${provider} sign-in, and you can start managing your tags immediately.`,
      body: 'Scan2Call helps people protect valuables with privacy-first QR identity tags, secure contact relay, and a clean dashboard for scans, subscriptions, and recovery actions.',
      ctaLabel: 'Open Dashboard',
      ctaUrl: dashboardUrl,
      note: 'This is a welcome email for a new social sign-in account. You will not receive this email again on future logins.',
    });

    await this.sendEmail(email, `Welcome to Scan2Call via ${provider}`, html, {
      critical: false,
      context: `${provider.toLowerCase()} welcome email`,
    });
  }

  /**
   * Notify tag owner when their tag has been scanned.
   * Respects user notification preferences (email, SMS, push).
   */
  async sendScanNotification(payload: ScanNotificationPayload): Promise<void> {
    const location =
      payload.scanCity && payload.scanCountry
        ? `${payload.scanCity}, ${payload.scanCountry}`
        : 'Unknown location';

    const tagName = payload.tagLabel || payload.tagToken;
    const dashboardUrl = `${this.configService.appUrl}/dashboard/tags`;
    const scannedAtFormatted = payload.scannedAt.toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">Scan2Call</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi ${payload.ownerFirstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Your tag <strong>"${tagName}"</strong> was just scanned.
          </p>
          <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 0 0 24px;">
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 4px;">
              <strong>Location:</strong> ${location}
            </p>
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
              <strong>Time:</strong> ${scannedAtFormatted}
            </p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 6px;">
              View Dashboard
            </a>
          </div>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
          Scan2Call - Smart NFC tags for instant contact
        </p>
      </div>
    `;

    await this.sendEmail(payload.ownerEmail, `Your tag "${tagName}" was just scanned`, html);

    // SMS notification via Twilio
    if (payload.ownerPhone && this.twilioClient) {
      const smsBody = `Scan2Call: Your tag "${tagName}" was just scanned${location !== 'Unknown location' ? ` near ${location}` : ''}. View details: ${dashboardUrl}`;
      try {
        await this.twilioClient.messages.create({
          to: payload.ownerPhone,
          from: this.configService.twilioPhoneNumber,
          body: smsBody,
        });
        this.logger.log(`[SCAN NOTIFICATION SMS] Sent to: ${payload.ownerPhone.slice(0, -4)}****`);
      } catch (error) {
        this.logger.warn(`[SCAN NOTIFICATION SMS] Failed to send: ${(error as Error).message}`);
      }
    }

    // Push notification - logged for now, implement with web-push or FCM when ready
    this.logger.log(
      `[SCAN NOTIFICATION PUSH] User tag "${tagName}" scanned at ${location}`,
    );
  }

  /**
   * Send order confirmation email after successful purchase.
   */
  async sendOrderConfirmation(payload: OrderConfirmationPayload): Promise<void> {
    const totalFormatted = `$${(payload.totalInCents / 100).toFixed(2)} AUD`;
    const orderUrl = `${this.configService.appUrl}/dashboard/orders/${payload.orderNumber}`;

    const itemRows = payload.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.name}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">$${(item.priceInCents / 100).toFixed(2)}</td>
          </tr>`,
      )
      .join('');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">Scan2Call</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi ${payload.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Thank you for your order. Here is your order summary.
          </p>
          <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 0 0 24px;">
            <p style="color: #374151; font-size: 14px; margin: 0 0 4px;">
              <strong>Order:</strong> ${payload.orderNumber}
            </p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px;">
            <thead>
              <tr>
                <th style="padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; text-align: left;">Item</th>
                <th style="padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; text-align: center;">Qty</th>
                <th style="padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          <div style="text-align: right; margin: 0 0 24px;">
            <p style="color: #111827; font-size: 18px; font-weight: 700; margin: 0;">
              Total: ${totalFormatted}
            </p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${orderUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 6px;">
              View Order
            </a>
          </div>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
          Scan2Call - Smart NFC tags for instant contact
        </p>
      </div>
    `;

    await this.sendEmail(payload.email, `Scan2Call Order Confirmation - ${payload.orderNumber}`, html);
  }

  /**
   * Send phone OTP via Twilio Verify. Falls back to console logging in dev.
   */
  async sendPhoneOtp(
    phone: string,
    otpCode?: string,
    options: DeliveryOptions = {},
  ): Promise<void> {
    try {
      if (!this.twilioClient || !this.twilioVerifyServiceSid) {
        if (options.critical && this.configService.isProduction) {
          this.handleCriticalFailure('Twilio Verify is not configured for phone verification.');
        }

        this.logger.log(`[DEV PHONE OTP] To: ${phone}, Code: ${otpCode ?? 'unavailable'}`);
        return;
      }

      await this.twilioClient.verify.v2
        .services(this.twilioVerifyServiceSid)
        .verifications.create({ to: phone, channel: 'sms' });

      this.logger.log(`Phone OTP sent to ${phone} via Twilio Verify`);
    } catch (error) {
      if (options.critical && this.configService.isProduction) {
        this.handleCriticalFailure('Failed to send phone verification code.', error);
      }

      this.logger.error(`Failed to send phone OTP to ${phone}: ${error}`);
    }
  }

  /**
   * Check phone OTP via Twilio Verify. Returns true if the code is valid.
   * Falls back to false when Twilio is not configured (DB OTP used as fallback).
   */
  async checkPhoneOtp(phone: string, code: string): Promise<boolean> {
    try {
      if (!this.twilioClient || !this.twilioVerifyServiceSid) {
        this.logger.log(`[DEV PHONE OTP CHECK] Twilio not configured, falling back to DB OTP check`);
        return false;
      }

      const check = await this.twilioClient.verify.v2
        .services(this.twilioVerifyServiceSid)
        .verificationChecks.create({ to: phone, code });

      return check.status === 'approved';
    } catch (error) {
      this.logger.error(`Failed to check phone OTP for ${phone}: ${error}`);
      return false;
    }
  }

  /**
   * Send contact form submission as email notification to admin.
   */
  async sendContactFormNotification(payload: ContactFormPayload): Promise<void> {
    const adminEmail = this.configService.resendFromEmail;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">Scan2Call</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px;">
          <h2 style="color: #111827; font-size: 18px; margin: 0 0 16px;">New Contact Form Submission</h2>
          <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 0 0 16px;">
            <p style="color: #374151; font-size: 14px; margin: 0 0 8px;"><strong>Name:</strong> ${payload.name}</p>
            <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Email:</strong> ${payload.email}</p>
          </div>
          <div style="background: #f9fafb; border-radius: 6px; padding: 16px;">
            <p style="color: #374151; font-size: 14px; margin: 0 0 8px;"><strong>Message:</strong></p>
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${payload.message}</p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(adminEmail, `Contact Form: ${payload.name}`, html);
  }

  /**
   * Notify tag owner that someone reported their item as found.
   */
  async sendItemFoundNotification(payload: ItemFoundPayload): Promise<void> {
    const rawTagName = payload.tagLabel || payload.tagToken;
    const tagName = this.escapeHtml(rawTagName);
    const ownerFirstName = this.escapeHtml(payload.ownerFirstName);
    const dashboardUrl = `${this.configService.appUrl}/dashboard/tags`;

    const finderMessageHtml = payload.finderMessage
      ? `
        <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 0 0 16px;">
          <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Finder Message</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${this.escapeHtml(payload.finderMessage)}</p>
        </div>
      `
      : '';

    const finderImageHtml = payload.finderImageUrl
      ? `
        <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 0 0 24px;">
          <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Finder Image</p>
          <a href="${this.escapeHtml(payload.finderImageUrl)}" style="color: #111827; text-decoration: underline; font-size: 14px;">Open uploaded image</a>
        </div>
      `
      : '';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">Scan2Call</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi ${ownerFirstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Great news! Someone has reported your item <strong>"${tagName}"</strong> as found.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Check your dashboard and tag scan history for details on when and where it was found.
          </p>
          ${finderMessageHtml}
          ${finderImageHtml}
          <div style="text-align: center; margin: 24px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 6px;">
              View Dashboard
            </a>
          </div>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
          Scan2Call - Smart NFC tags for instant contact
        </p>
      </div>
    `;

    await this.sendEmail(payload.ownerEmail, `Your item "${rawTagName}" has been found!`, html);
  }
}
