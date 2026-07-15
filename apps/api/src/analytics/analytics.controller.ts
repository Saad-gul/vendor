import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@marketverse/shared';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('platform')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform-wide analytics' })
  async platform() {
    return { success: true, data: await this.analyticsService.getPlatformAnalytics() };
  }

  @Get('vendor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vendor analytics' })
  async vendor(@CurrentUser('vendorId') vendorId: string | undefined) {
    if (!vendorId) throw new Error('Vendor not found');
    return { success: true, data: await this.analyticsService.getVendorAnalytics(vendorId) };
  }

  @Get('sales')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Monthly sales chart data' })
  async sales(@CurrentUser('vendorId') vendorId?: string) {
    return { success: true, data: await this.analyticsService.getMonthlySales(vendorId) };
  }
}
