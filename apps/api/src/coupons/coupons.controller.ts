import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { UserRole } from '@marketverse/shared';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create coupon' })
  async create(@CurrentUser('vendorId') vendorId: string | undefined, @CurrentUser('role') role: UserRole, @Body() dto: CreateCouponDto) {
    return { success: true, data: await this.couponsService.create(vendorId, role, dto) };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List coupons' })
  async findAll(@CurrentUser('vendorId') vendorId: string | undefined, @CurrentUser('role') role: UserRole) {
    return { success: true, data: await this.couponsService.findAll(vendorId, role) };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update coupon' })
  async update(@Param('id') id: string, @CurrentUser('vendorId') vendorId: string | undefined, @CurrentUser('role') role: UserRole, @Body() dto: UpdateCouponDto) {
    return { success: true, data: await this.couponsService.update(id, dto, vendorId, role) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete coupon' })
  async remove(@Param('id') id: string, @CurrentUser('vendorId') vendorId: string | undefined, @CurrentUser('role') role: UserRole) {
    await this.couponsService.remove(id, vendorId, role);
    return { success: true };
  }
}
