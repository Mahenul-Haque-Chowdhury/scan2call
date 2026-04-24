import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AppConfigService } from '../config/config.service';

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly configService: AppConfigService) {}

  async verifyToken(token: string, remoteIp?: string): Promise<void> {
    if (!token?.trim()) {
      throw new BadRequestException('Human verification is required.');
    }

    const secret = this.configService.turnstileSecretKey;

    if (!secret) {
      if (this.configService.isProduction) {
        throw new InternalServerErrorException('Captcha is currently unavailable. Please try again later.');
      }

      this.logger.warn('TURNSTILE_SECRET_KEY is not configured; skipping captcha verification in non-production.');
      return;
    }

    const body = new URLSearchParams({
      secret,
      response: token,
    });

    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    let response: Response;
    try {
      response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: AbortSignal.timeout(8000),
      });
    } catch (error) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        this.logger.error('Turnstile verification request timed out.');
        throw new InternalServerErrorException('Captcha verification timed out. Please try again.');
      }

      this.logger.error(`Turnstile verification request failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new InternalServerErrorException('Captcha verification is temporarily unavailable.');
    }

    if (!response.ok) {
      this.logger.error(`Turnstile verification failed with status ${response.status}`);
      throw new InternalServerErrorException('Captcha verification is temporarily unavailable.');
    }

    const result = await response.json() as TurnstileVerifyResponse;

    if (!result.success) {
      const errorCodes = result['error-codes']?.join(', ') || 'unknown_error';
      this.logger.warn(`Turnstile token rejected: ${errorCodes}`);
      throw new BadRequestException('Human verification failed. Please try again.');
    }
  }
}
