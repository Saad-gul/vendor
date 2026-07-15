import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser, TokenPayload } from '../auth.types';

const cookieExtractor = (req: Request) => {
  if (req && req.cookies) {
    return req.cookies['access_token'] || req.cookies['accessToken'];
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: TokenPayload): Promise<AuthenticatedUser> {
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { vendor: true } });
    if (!user) throw new UnauthorizedException('User not found');

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      vendorId: user.vendor?.id,
    };
  }
}
