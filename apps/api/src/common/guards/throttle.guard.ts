import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // Use X-Forwarded-For header when behind a reverse proxy, otherwise fall back to IP
    const ips = Array.isArray(req.ips)
      ? req.ips.filter((value): value is string => typeof value === 'string')
      : [];
    const ip = typeof req.ip === 'string' ? req.ip : '';
    return ips[0] ?? ip;
  }
}
