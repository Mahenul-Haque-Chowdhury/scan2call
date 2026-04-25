import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto, LoginDto, ResetPasswordDto } from './dto';
import type { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const EMAIL_VERIFY_TOKEN_EXPIRY_HOURS = 24;
const PHONE_OTP_EXPIRY_MINUTES = 10;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

export interface AuthTokens {
  accessToken: string;
  refreshTokenId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ──────────────────────────────────────────────
  // REGISTRATION
  // ──────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // Check for existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // Check phone uniqueness if provided
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException(
          'An account with this phone number already exists',
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    // Create user and email verification token in a transaction
    const { user, verificationToken } = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone ?? null,
          },
        });

        const verificationToken = await tx.verificationToken.create({
          data: {
            identifier: user.email,
            token: this.generateSecureToken(),
            type: 'EMAIL_VERIFY',
            expiresAt: this.addHours(new Date(), EMAIL_VERIFY_TOKEN_EXPIRY_HOURS),
          },
        });

        return { user, verificationToken };
      },
    );

    // Send verification email
    await this.notificationsService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationToken.token,
    );
    this.logger.log(
      `User registered: ${user.email}. Verification token created (id=${verificationToken.id}).`,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  // ──────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { subscription: { select: { status: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException(
        'Account is suspended. Please contact support.',
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please use the "Sign in with Google" button.',
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Issue tokens
    const tokens = await this.issueTokenPair(
      user.id,
      user.email,
      user.role,
      userAgent,
      ipAddress,
    );

    return {
      accessToken: tokens.accessToken,
      refreshTokenId: tokens.refreshTokenId,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        hasActiveSubscription: user.subscription?.status === 'ACTIVE',
      },
    };
  }

  // ──────────────────────────────────────────────
  // TOKEN REFRESH (with rotation)
  // ──────────────────────────────────────────────

  async refreshTokens(
    userId: string,
    oldTokenId: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    // Revoke the old refresh token
    await this.prisma.refreshToken.update({
      where: { id: oldTokenId },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    // Issue a new pair
    return this.issueTokenPair(
      user.id,
      user.email,
      user.role,
      userAgent,
      ipAddress,
    );
  }

  // ──────────────────────────────────────────────
  // LOGOUT (revoke refresh token)
  // ──────────────────────────────────────────────

  async logout(userId: string, tokenId?: string) {
    if (tokenId) {
      // Revoke specific token
      await this.prisma.refreshToken.updateMany({
        where: { id: tokenId, userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all refresh tokens for this user (logout everywhere)
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  // ──────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ──────────────────────────────────────────────

  async verifyEmail(token: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verificationToken.type !== 'EMAIL_VERIFY') {
      throw new BadRequestException('Invalid verification token type');
    }

    if (verificationToken.usedAt) {
      throw new BadRequestException('This token has already been used');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new one.',
      );
    }

    // Mark token as used and update user in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });

      await tx.user.updateMany({
        where: { email: verificationToken.identifier, emailVerified: false },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
    });

    return { message: 'Email verified successfully' };
  }

  // ──────────────────────────────────────────────
  // RESEND VERIFICATION EMAIL
  // ──────────────────────────────────────────────

  async resendVerificationEmail(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { email: true, firstName: true, emailVerified: true, deletedAt: true },
    });

    // Anti-enumeration: always return same message
    if (!user || user.deletedAt || user.emailVerified) {
      return { message: 'If an unverified account with that email exists, a verification email has been sent.' };
    }

    // Invalidate old tokens
    await this.prisma.verificationToken.updateMany({
      where: { identifier: normalizedEmail, type: 'EMAIL_VERIFY', usedAt: null },
      data: { usedAt: new Date() },
    });

    // Create new token
    const token = this.generateSecureToken();
    await this.prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        type: 'EMAIL_VERIFY',
        expiresAt: this.addHours(new Date(), EMAIL_VERIFY_TOKEN_EXPIRY_HOURS),
      },
    });

    await this.notificationsService.sendVerificationEmail(normalizedEmail, user.firstName, token);

    return { message: 'If an unverified account with that email exists, a verification email has been sent.' };
  }

  // ──────────────────────────────────────────────
  // PHONE VERIFICATION - send OTP
  // ──────────────────────────────────────────────

  async sendPhoneOtp(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phone: true, phoneVerified: true },
    });

    if (!user.phone) {
      throw new BadRequestException(
        'No phone number on file. Please update your profile first.',
      );
    }

    if (user.phoneVerified) {
      throw new BadRequestException('Phone number is already verified');
    }

    // Generate a 6-digit OTP
    const otp = this.generateOtp();

    // Invalidate any previous phone verification tokens for this user
    await this.prisma.verificationToken.updateMany({
      where: {
        identifier: userId,
        type: 'PHONE_VERIFY',
        usedAt: null,
      },
      data: { usedAt: new Date() }, // Mark as consumed so they can't be reused
    });

    await this.prisma.verificationToken.create({
      data: {
        identifier: userId,
        token: otp,
        type: 'PHONE_VERIFY',
        expiresAt: this.addMinutes(new Date(), PHONE_OTP_EXPIRY_MINUTES),
      },
    });

    // Send OTP via Twilio Verify (falls back to console logging in dev)
    await this.notificationsService.sendPhoneOtp(user.phone, otp, {
      critical: true,
      context: 'phone verification code',
    });
    this.logger.log(`Phone OTP generated for user ${userId}`);

    return { message: 'OTP sent to your phone number' };
  }

  // ──────────────────────────────────────────────
  // PHONE VERIFICATION - verify OTP
  // ──────────────────────────────────────────────

  async verifyPhone(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phone: true, phoneVerified: true },
    });

    if (!user.phone) {
      throw new BadRequestException('No phone number on file.');
    }

    if (user.phoneVerified) {
      throw new BadRequestException('Phone number is already verified.');
    }

    // Try Twilio Verify first (returns false if not configured)
    const twilioVerified = await this.notificationsService.checkPhoneOtp(user.phone, code);

    if (!twilioVerified) {
      // Fall back to DB-stored OTP check
      const verificationToken = await this.prisma.verificationToken.findFirst({
        where: {
          identifier: userId,
          token: code,
          type: 'PHONE_VERIFY',
          usedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!verificationToken) {
        throw new BadRequestException('Invalid or expired OTP code');
      }

      if (verificationToken.expiresAt < new Date()) {
        throw new BadRequestException('OTP code has expired. Please request a new one.');
      }

      // Mark DB token as used
      await this.prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });
    }

    // Mark phone as verified
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    });

    return { message: 'Phone number verified successfully' };
  }

  // ──────────────────────────────────────────────
  // FORGOT PASSWORD - request reset
  // ──────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent user enumeration
    if (!user || user.deletedAt) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Invalidate any existing password reset tokens
    await this.prisma.verificationToken.updateMany({
      where: {
        identifier: user.email,
        type: 'PASSWORD_RESET',
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const resetToken = await this.prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: this.generateSecureToken(),
        type: 'PASSWORD_RESET',
        expiresAt: this.addHours(new Date(), PASSWORD_RESET_TOKEN_EXPIRY_HOURS),
      },
    });

    // Send password reset email
    await this.notificationsService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken.token,
    );
    this.logger.log(
      `Password reset token created for ${user.email} (id=${resetToken.id})`,
    );

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  // ──────────────────────────────────────────────
  // RESET PASSWORD - complete reset
  // ──────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token: dto.token },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (verificationToken.type !== 'PASSWORD_RESET') {
      throw new BadRequestException('Invalid reset token type');
    }

    if (verificationToken.usedAt) {
      throw new BadRequestException('This reset token has already been used');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException(
        'Reset token has expired. Please request a new one.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      // Mark token as used
      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });

      // Update password
      await tx.user.updateMany({
        where: { email: verificationToken.identifier },
        data: { passwordHash },
      });

      // Revoke all refresh tokens (force re-login on all devices)
      const user = await tx.user.findUnique({
        where: { email: verificationToken.identifier },
        select: { id: true },
      });

      if (user) {
        await tx.refreshToken.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    });

    return { message: 'Password has been reset successfully. Please log in.' };
  }

  // ──────────────────────────────────────────────
  // CHANGE PASSWORD (authenticated)
  // ──────────────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account uses Google sign-in and has no password to change. You can set a password from your profile settings.',
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      // Revoke all refresh tokens except we'll let the caller re-issue if needed
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  // ──────────────────────────────────────────────
  // GOOGLE OAUTH LOGIN
  // ──────────────────────────────────────────────

  async validateGoogleLogin(
    googleProfile: {
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    },
    userAgent?: string,
    ipAddress?: string,
  ) {
    const { googleId, email, firstName, lastName, avatarUrl } = googleProfile;

    // 1. Find existing user by googleId
    let user = await this.prisma.user.findFirst({
      where: { googleId },
    });

    if (user) {
      if (user.deletedAt) throw new UnauthorizedException('Account has been deleted');
      if (user.isSuspended) throw new UnauthorizedException('Account is suspended');
      await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      const tokens = await this.issueTokenPair(user.id, user.email, user.role, userAgent, ipAddress);
      return { tokens, user, isNewUser: false };
    }

    // 2. Find existing user by email (link accounts)
    user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      if (user.deletedAt) throw new UnauthorizedException('Account has been deleted');
      if (user.isSuspended) throw new UnauthorizedException('Account is suspended');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          emailVerified: true,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          avatarUrl: user.avatarUrl ?? avatarUrl,
          lastLoginAt: new Date(),
        },
      });
      const tokens = await this.issueTokenPair(user.id, user.email, user.role, userAgent, ipAddress);
      return { tokens, user, isNewUser: false };
    }

    // 3. Create new user
    const newUser = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        googleId,
        firstName,
        lastName,
        passwordHash: null,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        avatarUrl,
      },
    });

    await this.notificationsService.sendSocialWelcomeEmail(
      newUser.email,
      newUser.firstName,
      'Google',
    );

    const tokens = await this.issueTokenPair(newUser.id, newUser.email, newUser.role, userAgent, ipAddress);
    return { tokens, user: newUser, isNewUser: true };
  }

  // ──────────────────────────────────────────────
  // FACEBOOK OAUTH LOGIN
  // ──────────────────────────────────────────────

  async validateFacebookLogin(
    facebookProfile: {
      facebookId: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    },
    userAgent?: string,
    ipAddress?: string,
  ) {
    const { facebookId, email, firstName, lastName, avatarUrl } = facebookProfile;

    // 1. Find existing user by facebookId
    let user = await this.prisma.user.findFirst({
      where: { facebookId },
    });

    if (user) {
      if (user.deletedAt) throw new UnauthorizedException('Account has been deleted');
      if (user.isSuspended) throw new UnauthorizedException('Account is suspended');
      await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      const tokens = await this.issueTokenPair(user.id, user.email, user.role, userAgent, ipAddress);
      return { tokens, user, isNewUser: false };
    }

    // 2. Find existing user by email (link accounts)
    if (email) {
      user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        if (user.deletedAt) throw new UnauthorizedException('Account has been deleted');
        if (user.isSuspended) throw new UnauthorizedException('Account is suspended');
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            facebookId,
            emailVerified: true,
            emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
            avatarUrl: user.avatarUrl ?? avatarUrl,
            lastLoginAt: new Date(),
          },
        });
        const tokens = await this.issueTokenPair(user.id, user.email, user.role, userAgent, ipAddress);
        return { tokens, user, isNewUser: false };
      }
    }

    // 3. Create new user (email might be null if user didn't grant email permission)
    if (!email) {
      throw new UnauthorizedException('Email is required. Please grant email permission on Facebook.');
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        facebookId,
        firstName,
        lastName,
        passwordHash: null,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        avatarUrl,
      },
    });

    await this.notificationsService.sendSocialWelcomeEmail(
      newUser.email,
      newUser.firstName,
      'Facebook',
    );

    const tokens = await this.issueTokenPair(newUser.id, newUser.email, newUser.role, userAgent, ipAddress);
    return { tokens, user: newUser, isNewUser: true };
  }

  // ──────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────

  /**
   * Issues an access token + refresh token pair.
   * The refresh token is stored in the database for rotation and revocation.
   */
  private async issueTokenPair(
    userId: string,
    email: string,
    role: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    // Create a database record for the refresh token first to get its ID
    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        token: this.generateSecureToken(),
        userId,
        expiresAt: this.addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS),
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
      },
    });

    // Sign access token (short-lived) - JwtModule handles RS256 signing
    const accessTokenPayload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload);

    // Sign refresh token JWT (long-lived, contains tokenId for DB lookup)
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }

    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        tokenId: refreshTokenRecord.id,
      },
      {
        secret: refreshSecret,
        algorithm: 'HS256',
        expiresIn: '7d',
      },
    );

    // Update the stored record with the actual signed JWT
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    });

    return {
      accessToken,
      refreshTokenId: refreshTokenRecord.id,
    };
  }

  /**
   * Builds the signed refresh token JWT for setting in a cookie.
   * Called by the controller after issueTokenPair to get the cookie value.
   */
  async getRefreshTokenValue(tokenId: string): Promise<string> {
    const record = await this.prisma.refreshToken.findUniqueOrThrow({
      where: { id: tokenId },
    });
    return record.token;
  }

  /** Generates a cryptographically secure URL-safe token. */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /** Generates a 6-digit numeric OTP. */
  private generateOtp(): string {
    const num = crypto.randomInt(0, 1_000_000);
    return num.toString().padStart(6, '0');
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  private addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
