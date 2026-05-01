import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  VerifyPhoneDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';
import { Public } from './decorators';
import { CurrentUser } from './decorators';
import { JwtRefreshGuard, GoogleAuthGuard, FacebookAuthGuard } from './guards';

const REFRESH_COOKIE_NAME = 'refresh_token';

type GoogleOAuthProfile = Parameters<AuthService['validateGoogleLogin']>[0];
type FacebookOAuthProfile = Parameters<AuthService['validateFacebookLogin']>[0];

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ──────────────────────────────────────────────
  // POST /auth/register
  // ──────────────────────────────────────────────

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or phone already in use' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      data: result,
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  // ──────────────────────────────────────────────
  // POST /auth/login
  // ──────────────────────────────────────────────

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, userAgent, ip);

    // Get the signed refresh JWT and set it as an HttpOnly cookie
    const refreshTokenValue = await this.authService.getRefreshTokenValue(
      result.refreshTokenId,
    );
    this.setRefreshTokenCookie(res, refreshTokenValue);

    return {
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  // ──────────────────────────────────────────────
  // POST /auth/refresh
  // ──────────────────────────────────────────────

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @CurrentUser() user: { id: string; email: string; role: string; tokenId: string },
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(
      user.id,
      user.tokenId,
      userAgent,
      ip,
    );

    const refreshTokenValue = await this.authService.getRefreshTokenValue(
      tokens.refreshTokenId,
    );
    this.setRefreshTokenCookie(res, refreshTokenValue);

    return {
      data: {
        accessToken: tokens.accessToken,
      },
    };
  }

  // ──────────────────────────────────────────────
  // POST /auth/logout
  // ──────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out and revoke refresh tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    this.clearRefreshTokenCookie(res);
    return { data: { message: 'Logged out successfully' } };
  }

  // ──────────────────────────────────────────────
  // POST /auth/verify-email
  // ──────────────────────────────────────────────

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto.token);
    return { data: result };
  }

  // ──────────────────────────────────────────────
  // POST /auth/resend-verification
  // ──────────────────────────────────────────────

  @Public()
  @Post('resend-verification')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Verification email sent if applicable' })
  async resendVerification(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.resendVerificationEmail(dto.email);
    return { data: result };
  }

  // ──────────────────────────────────────────────
  // POST /auth/send-phone-otp
  // ──────────────────────────────────────────────

  @Post('send-phone-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send OTP code to the authenticated user phone' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiResponse({ status: 400, description: 'No phone on file or already verified' })
  async sendPhoneOtp(@CurrentUser('id') userId: string) {
    const result = await this.authService.sendPhoneOtp(userId);
    return { data: result };
  }

  // ──────────────────────────────────────────────
  // POST /auth/verify-phone
  // ──────────────────────────────────────────────

  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify phone number with OTP code' })
  @ApiBody({ type: VerifyPhoneDto })
  @ApiResponse({ status: 200, description: 'Phone verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyPhone(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyPhoneDto,
  ) {
    const result = await this.authService.verifyPhone(userId, dto.code);
    return { data: result };
  }

  // ──────────────────────────────────────────────
  // POST /auth/forgot-password
  // ──────────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'If the email exists, a reset link is sent',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email);
    return { data: result };
  }

  // ──────────────────────────────────────────────
  // POST /auth/reset-password
  // ──────────────────────────────────────────────

  @Public()
  @Post('reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a reset token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return { data: result };
  }

  // ──────────────────────────────────────────────
  // POST /auth/change-password
  // ──────────────────────────────────────────────

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (authenticated)' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    this.clearRefreshTokenCookie(res);
    return { data: result };
  }

  // ──────────────────────────────────────────────
  // GET /auth/google
  // ──────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent screen' })
  async googleLogin() {
    // Guard redirects to Google consent screen
  }

  // ──────────────────────────────────────────────
  // GET /auth/google/callback
  // ──────────────────────────────────────────────

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to app with tokens' })
  async googleCallback(
    @Req() req: Request & { user?: GoogleOAuthProfile },
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
    @Res() res: Response,
  ) {
    const appUrl = this.configService.get('APP_URL') || 'http://localhost:3002';
    const googleUser = req.user;

    if (!googleUser) {
      return res.redirect(`${appUrl}/login?error=google_auth_failed`);
    }

    try {
      const result = await this.authService.validateGoogleLogin(googleUser, userAgent, ip);
      const refreshTokenValue = await this.authService.getRefreshTokenValue(result.tokens.refreshTokenId);
      this.setRefreshTokenCookie(res, refreshTokenValue);
      return res.redirect(`${appUrl}/dashboard`);
    } catch {
      return res.redirect(`${appUrl}/login?error=google_auth_failed`);
    }
  }

  // ──────────────────────────────────────────────
  // GET /auth/facebook
  // ──────────────────────────────────────────────

  @Public()
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Facebook consent screen' })
  async facebookLogin() {
    // Guard redirects to Facebook consent screen
  }

  // ──────────────────────────────────────────────
  // GET /auth/facebook/callback
  // ──────────────────────────────────────────────

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to app with tokens' })
  async facebookCallback(
    @Req() req: Request & { user?: FacebookOAuthProfile },
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
    @Res() res: Response,
  ) {
    const appUrl = this.configService.get('APP_URL') || 'http://localhost:3002';
    const facebookUser = req.user;

    if (!facebookUser) {
      return res.redirect(`${appUrl}/login?error=facebook_auth_failed`);
    }

    try {
      const result = await this.authService.validateFacebookLogin(facebookUser, userAgent, ip);
      const refreshTokenValue = await this.authService.getRefreshTokenValue(result.tokens.refreshTokenId);
      this.setRefreshTokenCookie(res, refreshTokenValue);
      return res.redirect(`${appUrl}/dashboard`);
    } catch {
      return res.redirect(`${appUrl}/login?error=facebook_auth_failed`);
    }
  }

  // ──────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────

  private setRefreshTokenCookie(res: Response, token: string) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/api/v1/auth',
    });
  }
}
