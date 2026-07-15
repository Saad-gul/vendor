import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { vendor: true } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.name) data.name = dto.name;
    if (dto.avatar) data.avatar = dto.avatar;

    const user = await this.prisma.user.update({ where: { id: userId }, data, include: { vendor: true } });
    return this.sanitize(user);
  }

  async updatePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new BadRequestException('Invalid request');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { success: true };
  }

  async updateAddress(userId: string, dto: UpdateAddressDto) {
    const existing = await this.prisma.userAddress.findUnique({ where: { userId } });
    if (existing) {
      await this.prisma.userAddress.update({ where: { userId }, data: dto as Prisma.UserAddressUpdateInput });
    } else {
      await this.prisma.userAddress.create({ data: { userId, ...dto } as Prisma.UserAddressUncheckedCreateInput });
    }
    return this.getAddress(userId);
  }

  async getAddress(userId: string) {
    return this.prisma.userAddress.findUnique({ where: { userId } });
  }

  private sanitize(user: { password?: string | null; refreshTokens?: string[]; oauthId?: string | null; [key: string]: unknown }) {
    const { password, refreshTokens, oauthId, ...rest } = user;
    return rest;
  }
}
