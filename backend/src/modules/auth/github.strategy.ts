/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:8080/api/v1/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any) => void,
  ): Promise<void> {
    const emails = (profile as any).emails as { value?: string; verified?: boolean }[] | undefined;
    const email = emails?.[0]?.value;
    const avatar = (profile as any).photos?.[0]?.value;

    done(null, {
      githubId: profile.id,
      email,
      displayName: profile.displayName || profile.username,
      username: profile.username,
      avatar,
      accessToken,
    });
  }
}
