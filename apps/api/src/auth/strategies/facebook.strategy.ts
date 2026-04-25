import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AppConfigService } from '../../config/config.service';

interface FacebookOAuthUser {
  facebookId: string;
  email: string | undefined;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: AppConfigService) {
    const apiUrl = configService.apiUrl || 'http://localhost:3001';

    super({
      clientID: configService.facebookAppId || 'not-configured',
      clientSecret: configService.facebookAppSecret || 'not-configured',
      callbackURL:
        configService.facebookCallbackUrl ||
        `${apiUrl}/api/v1/auth/facebook/callback`,
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: unknown, user?: FacebookOAuthUser) => void,
  ): Promise<void> {
    const { id, emails, name, photos } = profile;
    const user: FacebookOAuthUser = {
      facebookId: id,
      email: emails?.[0]?.value,
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatarUrl: photos?.[0]?.value ?? null,
    };
    done(null, user);
  }
}
