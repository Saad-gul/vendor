import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow('GITHUB_CLIENT_ID'),
      clientSecret: config.getOrThrow('GITHUB_CLIENT_SECRET'),
      callbackURL: config.get('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: unknown, done: VerifyCallback) {
    const p = profile as { emails?: { value: string }[]; displayName?: string; username: string; id: string; photos?: { value: string }[] };
    const email = p.emails?.[0]?.value || `${p.username}@github.local`;

    const user = {
      email,
      name: p.displayName || p.username,
      provider: 'github',
      providerId: p.id,
      avatar: p.photos?.[0]?.value,
    };
    done(null, user);
  }
}
