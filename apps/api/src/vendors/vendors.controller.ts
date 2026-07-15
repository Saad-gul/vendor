import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { UserRole } from '@marketverse/shared';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to become a vendor' })
  async apply(@CurrentUser('sub') userId: string, @Body() dto: CreateVendorDto) {
    return { success: true, data: await this.vendorsService.create(userId, dto) };
  }

  @Get()
  @ApiOperation({ summary: 'List all vendors' })
  async findAll(@Query() pagination: PaginationDto, @Query('search') search?: string) {
    return { success: true, data: await this.vendorsService.findAll({ ...pagination, search }) };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current vendor profile' })
  async me(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.vendorsService.findByUserId(userId) };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor store profile' })
  async update(@CurrentUser('sub') userId: string, @Body() dto: UpdateVendorDto) {
    return { success: true, data: await this.vendorsService.update(userId, dto) };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get public vendor store by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return { success: true, data: await this.vendorsService.findBySlug(slug) };
  }
}
