import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { RegisterDto, LoginDto, RefreshTokenDto, ResetPasswordDto, VerifyEmailDto } from './dto';
import { AuthTokens, TokenPayload } from './auth.types';
import { DEFAULT_VENDOR_COMMISSION } from '@marketverse/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const role = (dto.role as UserRole | undefined) || UserRole.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        name: dto.name,
        role,
        emailVerified: false,
      },
    });

    if (role === UserRole.VENDOR) {
      await this.prisma.vendor.create({
        data: {
          userId: user.id,
          storeName: dto.storeName || `${dto.name || user.email}'s Store`,
          storeSlug: dto.storeSlug || this.generateStoreSlug(dto.storeName || dto.name || user.email.split('@')[0]),
          commissionRate: DEFAULT_VENDOR_COMMISSION,
        },
      });
    }

    await this.sendVerificationEmail(user);

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const hash = await this.hashToken(dto.refreshToken);
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, refreshTokens: { has: hash } },
    });
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    await this.revokeRefreshToken(user.id, dto.refreshToken);
    return this.generateTokens(user);
  }

  async logout(userId: string, refreshToken: string) {
    await this.revokeRefreshToken(userId, refreshToken);
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokens: [] } });
    return { success: true };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const key = `email-verify:${dto.token}`;
    const userId = await this.redis.getClient().get(key);
    if (!userId) throw new BadRequestException('Invalid or expired verification token');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    await this.redis.getClient().del(key);
    return { user: this.sanitizeUser(user) };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) throw new BadRequestException('Email already verified');
    await this.sendVerificationEmail(user);
    return { success: true };
  }

  async forgotPassword(dto: { email: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) return { success: true }; // don't leak existence

    const token = uuid();
    await this.redis.getClient().setex(`forgot-password:${token}`, 900, user.id);

    this.logger.log(`Password reset link: ${this.config.get('APP_URL')}/reset-password?token=${token}`);
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const key = `forgot-password:${dto.token}`;
    const userId = await this.redis.getClient().get(key);
    if (!userId) throw new BadRequestException('Invalid or expired reset token');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, refreshTokens: [] },
    });

    await this.redis.getClient().del(key);
    return { success: true };
  }

  async handleOAuth(profile: { email: string; name?: string; provider: string; providerId: string; avatar?: string }, role: UserRole = UserRole.CUSTOMER) {
    let user = await this.prisma.user.findFirst({
      where: { oauthProvider: profile.provider, oauthId: profile.providerId },
    });

    if (!user && profile.email) {
      user = await this.prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          name: profile.name,
          avatar: profile.avatar,
          role,
          emailVerified: true,
          oauthProvider: profile.provider,
          oauthId: profile.providerId,
        },
      });

      if (role === UserRole.VENDOR) {
        await this.prisma.vendor.create({
          data: {
            userId: user.id,
            storeName: `${profile.name || user.email}'s Store`,
            storeSlug: this.generateStoreSlug(profile.name || user.email.split('@')[0]),
            commissionRate: DEFAULT_VENDOR_COMMISSION,
          },
        });
      }
    }

    return this.generateTokens(user);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { vendor: true } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, role: user.role } as Omit<TokenPayload, 'type'>;

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRATION'),
    });

    const refreshToken = this.jwt.sign(
      { ...payload, type: 'refresh' as const },
      { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRATION') },
    );

    const refreshHash = await this.hashToken(refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokens: { push: refreshHash } },
    });

    const expiresIn = 900;
    return { accessToken, refreshToken, expiresIn };
  }

  private async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.jwt.verifyAsync(token, { secret: this.config.get('JWT_REFRESH_SECRET') });
  }

  private async revokeRefreshToken(userId: string, token: string): Promise<void> {
    const hash = await this.hashToken(token);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const tokens = user.refreshTokens.filter((t) => t !== hash);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokens: tokens } });
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 4);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = uuid();
    await this.redis.getClient().setex(`email-verify:${token}`, 3600, user.id);
    this.logger.log(`Email verification link: ${this.config.get('APP_URL')}/verify-email?token=${token}`);
  }

  private generateStoreSlug(input: string): string {
    const base = input
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
    return `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  sanitizeUser(user: User & { vendor?: unknown }) {
    const rest = { ...user } as Record<string, unknown>;
    delete rest.password;
    delete rest.refreshTokens;
    delete rest.oauthId;
    return rest as Omit<User, 'password' | 'refreshTokens' | 'oauthId'> & { vendor?: unknown };
  }
}
