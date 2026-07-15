import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: unknown, done: VerifyCallback) {
    const p = profile as { emails?: { value: string }[]; displayName?: string; id: string; photos?: { value: string }[] };
    const email = p.emails?.[0]?.value;
    if (!email) return done(new Error('No email returned from Google'), false);

    const user = {
      email,
      name: p.displayName,
      provider: 'google',
      providerId: p.id,
      avatar: p.photos?.[0]?.value,
    };
    done(null, user);
  }
}
