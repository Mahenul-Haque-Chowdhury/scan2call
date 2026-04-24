import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import { PrismaService } from '../database/prisma.service';

interface ServiceCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unconfigured';
  responseMs: number | null;
  message: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AdminSystemService {
  private readonly logger = new Logger(AdminSystemService.name);
  private readonly startedAt = new Date();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getSystemStatus() {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkResend(),
      this.checkTwilio(),
      this.checkStripe(),
      this.checkStorage(),
      this.checkGoogleOAuth(),
      this.checkFacebookOAuth(),
      this.checkJwt(),
    ]);

    const dbStats = await this.getDatabaseStats();

    const healthy = checks.filter((c) => c.status === 'healthy').length;
    const degraded = checks.filter((c) => c.status === 'degraded').length;
    const down = checks.filter((c) => c.status === 'down').length;
    const unconfigured = checks.filter((c) => c.status === 'unconfigured').length;

    let overall: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (down > 0) overall = 'down';
    else if (degraded > 0 || unconfigured > 1) overall = 'degraded';

    return {
      overall,
      uptime: this.getUptime(),
      environment: this.config.get('NODE_ENV') || 'development',
      version: process.env.npm_package_version || '0.0.1',
      node: process.version,
      memory: this.getMemoryUsage(),
      timestamp: new Date().toISOString(),
      summary: { healthy, degraded, down, unconfigured, total: checks.length },
      services: checks,
      database: dbStats,
    };
  }

  // ── Database ──────────────────────────────────

  private async checkDatabase(): Promise<ServiceCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        name: 'PostgreSQL',
        status: 'healthy',
        responseMs: Date.now() - start,
        message: 'Connected and responding',
      };
    } catch (err) {
      this.logger.error('Database health check failed', err);
      return {
        name: 'PostgreSQL',
        status: 'down',
        responseMs: Date.now() - start,
        message: 'Connection failed',
      };
    }
  }

  // ── Redis ─────────────────────────────────────

  private async checkRedis(): Promise<ServiceCheck> {
    const redisUrl = this.config.get('REDIS_URL');
    if (!redisUrl) {
      return {
        name: 'Redis',
        status: 'unconfigured',
        responseMs: null,
        message: 'REDIS_URL not set',
      };
    }

    const start = Date.now();
    try {
      // Attempt TCP connection to Redis
      const url = new URL(redisUrl);
      const host = url.hostname || '127.0.0.1';
      const port = parseInt(url.port || '6379', 10);
      await this.tcpCheck(host, port, 3000);
      return {
        name: 'Redis',
        status: 'healthy',
        responseMs: Date.now() - start,
        message: `Reachable at ${host}:${port}`,
      };
    } catch {
      return {
        name: 'Redis',
        status: 'down',
        responseMs: Date.now() - start,
        message: 'Connection refused or timed out',
      };
    }
  }

  // ── Resend (Email) ────────────────────────────

  private async checkResend(): Promise<ServiceCheck> {
    const apiKey = this.config.get('RESEND_API_KEY');
    if (!apiKey) {
      return {
        name: 'Resend (Email)',
        status: 'unconfigured',
        responseMs: null,
        message: 'RESEND_API_KEY not set',
      };
    }

    const start = Date.now();
    try {
      const res = await fetch('https://api.resend.com/api-keys', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        return {
          name: 'Resend (Email)',
          status: 'healthy',
          responseMs: Date.now() - start,
          message: 'API key valid',
          details: {
            from: this.config.get('RESEND_FROM_EMAIL') || 'not set',
          },
        };
      }
      return {
        name: 'Resend (Email)',
        status: 'degraded',
        responseMs: Date.now() - start,
        message: `API returned ${res.status}`,
      };
    } catch {
      return {
        name: 'Resend (Email)',
        status: 'degraded',
        responseMs: Date.now() - start,
        message: 'Could not reach Resend API',
      };
    }
  }

  // ── Twilio ────────────────────────────────────

  private async checkTwilio(): Promise<ServiceCheck> {
    const sid = this.config.get('TWILIO_ACCOUNT_SID');
    const token = this.config.get('TWILIO_AUTH_TOKEN');
    if (!sid || !token) {
      return {
        name: 'Twilio',
        status: 'unconfigured',
        responseMs: null,
        message: 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set',
        details: {
          phoneNumber: this.config.get('TWILIO_PHONE_NUMBER') ? 'set' : 'not set',
          verifySid: this.config.get('TWILIO_VERIFY_SERVICE_SID') ? 'set' : 'not set',
          proxySid: this.config.get('TWILIO_PROXY_SERVICE_SID') ? 'set' : 'not set',
        },
      };
    }

    const start = Date.now();
    try {
      const credentials = Buffer.from(`${sid}:${token}`).toString('base64');
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`,
        {
          headers: { Authorization: `Basic ${credentials}` },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (res.ok) {
        const body = (await res.json()) as { friendly_name?: string };
        return {
          name: 'Twilio',
          status: 'healthy',
          responseMs: Date.now() - start,
          message: `Account active (${body.friendly_name || sid})`,
          details: {
            phoneNumber: this.config.get('TWILIO_PHONE_NUMBER') ? 'set' : 'not set',
            verifySid: this.config.get('TWILIO_VERIFY_SERVICE_SID') ? 'set' : 'not set',
            proxySid: this.config.get('TWILIO_PROXY_SERVICE_SID') ? 'set' : 'not set',
          },
        };
      }
      return {
        name: 'Twilio',
        status: 'degraded',
        responseMs: Date.now() - start,
        message: `API returned ${res.status}`,
      };
    } catch {
      return {
        name: 'Twilio',
        status: 'degraded',
        responseMs: Date.now() - start,
        message: 'Could not reach Twilio API',
      };
    }
  }

  // ── Stripe ────────────────────────────────────

  private async checkStripe(): Promise<ServiceCheck> {
    const key = this.config.get('STRIPE_SECRET_KEY');
    if (!key) {
      return {
        name: 'Stripe',
        status: 'unconfigured',
        responseMs: null,
        message: 'STRIPE_SECRET_KEY not set',
      };
    }

    const start = Date.now();
    try {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const body = (await res.json()) as { available?: { currency?: string }[] };
        const available = body.available?.[0];
        return {
          name: 'Stripe',
          status: 'healthy',
          responseMs: Date.now() - start,
          message: 'API key valid, account active',
          details: {
            currency: available?.currency?.toUpperCase() || 'N/A',
            webhookSecret: this.config.get('STRIPE_WEBHOOK_SECRET') ? 'set' : 'not set',
            priceId: this.config.get('STRIPE_SUBSCRIPTION_PRICE_ID') ? 'set' : 'not set',
          },
        };
      }
      return {
        name: 'Stripe',
        status: 'degraded',
        responseMs: Date.now() - start,
        message: `API returned ${res.status}`,
      };
    } catch {
      return {
        name: 'Stripe',
        status: 'degraded',
        responseMs: Date.now() - start,
        message: 'Could not reach Stripe API',
      };
    }
  }

  // ── S3 / R2 Storage ───────────────────────────

  private async checkStorage(): Promise<ServiceCheck> {
    const endpoint = this.config.get('S3_ENDPOINT');
    const accessKey = this.config.get('S3_ACCESS_KEY_ID');
    if (!endpoint || !accessKey) {
      return {
        name: 'Storage (S3/R2)',
        status: 'unconfigured',
        responseMs: null,
        message: 'S3_ENDPOINT or S3_ACCESS_KEY_ID not set',
        details: {
          bucket: this.config.get('S3_BUCKET') || 'not set',
          region: this.config.get('S3_REGION') || 'not set',
          cdn: this.config.get('CDN_URL') ? 'set' : 'not set',
        },
      };
    }

    const start = Date.now();
    try {
      const res = await fetch(endpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      return {
        name: 'Storage (S3/R2)',
        status: res.status < 500 ? 'healthy' : 'degraded',
        responseMs: Date.now() - start,
        message: `Endpoint reachable (${res.status})`,
        details: {
          bucket: this.config.get('S3_BUCKET') || 'not set',
          region: this.config.get('S3_REGION') || 'not set',
        },
      };
    } catch {
      return {
        name: 'Storage (S3/R2)',
        status: 'down',
        responseMs: Date.now() - start,
        message: 'Endpoint unreachable',
      };
    }
  }

  // ── Google OAuth ──────────────────────────────

  private async checkGoogleOAuth(): Promise<ServiceCheck> {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    if (!clientId) {
      return {
        name: 'Google OAuth',
        status: 'unconfigured',
        responseMs: null,
        message: 'GOOGLE_CLIENT_ID not set',
      };
    }

    return {
      name: 'Google OAuth',
      status: 'healthy',
      responseMs: null,
      message: 'Credentials configured',
      details: {
        callbackUrl: this.config.get('GOOGLE_CALLBACK_URL') || 'not set',
      },
    };
  }

  // ── Facebook OAuth ─────────────────────────────

  private async checkFacebookOAuth(): Promise<ServiceCheck> {
    const appId = this.config.get('FACEBOOK_APP_ID');
    const appSecret = this.config.get('FACEBOOK_APP_SECRET');
    if (!appId || !appSecret) {
      return {
        name: 'Facebook OAuth',
        status: 'unconfigured',
        responseMs: null,
        message: !appId ? 'FACEBOOK_APP_ID not set' : 'FACEBOOK_APP_SECRET not set',
      };
    }

    const start = Date.now();
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${appId}?access_token=${appId}|${appSecret}&fields=id,name`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const body = (await res.json()) as { name?: string };
        return {
          name: 'Facebook OAuth',
          status: 'healthy',
          responseMs: Date.now() - start,
          message: `App active (${body.name || appId})`,
          details: {
            callbackUrl: this.config.get('FACEBOOK_CALLBACK_URL') || 'not set',
          },
        };
      }
      return {
        name: 'Facebook OAuth',
        status: 'degraded',
        responseMs: Date.now() - start,
        message: `Graph API returned ${res.status}`,
      };
    } catch {
      return {
        name: 'Facebook OAuth',
        status: 'degraded',
        responseMs: Date.now() - start,
        message: 'Could not reach Facebook Graph API',
      };
    }
  }

  // ── JWT Auth ──────────────────────────────────

  private checkJwt(): ServiceCheck {
    const privateKey = this.config.get('JWT_ACCESS_PRIVATE_KEY');
    const publicKey = this.config.get('JWT_ACCESS_PUBLIC_KEY');
    const refreshSecret = this.config.get('JWT_REFRESH_SECRET');
    const hasKeys = !!privateKey && !!publicKey && privateKey.length > 100;
    const hasRefresh = !!refreshSecret && refreshSecret !== 'your-refresh-secret-here';

    if (!hasKeys || !hasRefresh) {
      return {
        name: 'JWT Auth (RS256)',
        status: 'degraded',
        responseMs: null,
        message: !hasKeys ? 'JWT RSA keys not configured properly' : 'JWT_REFRESH_SECRET is using default/placeholder',
        details: {
          rsaKeys: hasKeys ? 'set' : 'missing/invalid',
          refreshSecret: hasRefresh ? 'set' : 'default/placeholder',
        },
      };
    }

    return {
      name: 'JWT Auth (RS256)',
      status: 'healthy',
      responseMs: null,
      message: 'RS256 keys configured',
      details: {
        accessSecret: 'set',
        refreshSecret: 'set',
      },
    };
  }

  // ── Database Stats ────────────────────────────

  private async getDatabaseStats() {
    try {
      const [userCount, tagCount, scanCount, orderCount, activeSubscriptions] =
        await Promise.all([
          this.prisma.user.count({ where: { deletedAt: null } }),
          this.prisma.tag.count({ where: { deletedAt: null } }),
          this.prisma.scan.count(),
          this.prisma.order.count(),
          this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        ]);

      return {
        users: userCount,
        tags: tagCount,
        scans: scanCount,
        orders: orderCount,
        activeSubscriptions,
      };
    } catch {
      return null;
    }
  }

  // ── Helpers ───────────────────────────────────

  private getUptime() {
    const ms = Date.now() - this.startedAt.getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  }

  private getMemoryUsage() {
    const mem = process.memoryUsage();
    return {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      externalMB: Math.round(mem.external / 1024 / 1024),
    };
  }

  private tcpCheck(host: string, port: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Timeout'));
      });
      socket.on('error', (err: Error) => {
        socket.destroy();
        reject(err);
      });
      socket.connect(port, host);
    });
  }
}
