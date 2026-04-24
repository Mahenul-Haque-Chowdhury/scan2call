import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';

/**
 * Extracts the refresh token from the HttpOnly cookie named `refresh_token`.
 */
function extractRefreshTokenFromCookie(req: Request): string | null {
  return req?.cookies?.refresh_token ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }

    super({
      jwtFromRequest: extractRefreshTokenFromCookie,
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; tokenId: string }) {
    const rawToken = req.cookies?.refresh_token;
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Verify the refresh token record exists and is not revoked
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedToken.revokedAt) {
      // Possible token reuse attack: revoke all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Refresh token has been revoked - all sessions invalidated',
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isSuspended: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.isSuspended) {
      throw new UnauthorizedException('User account is not accessible');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenId: payload.tokenId,
    };
  }
}
