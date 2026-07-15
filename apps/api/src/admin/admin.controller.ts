import { Controller, Get, Patch, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@marketverse/shared';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  async listUsers(@Query() pagination: PaginationDto, @Query('role') role?: UserRole, @Query('search') search?: string) {
    return { success: true, data: await this.adminService.listUsers({ ...pagination, role, search }) };
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user role' })
  async updateRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return { success: true, data: await this.adminService.updateUserRole(id, role) };
  }

  @Get('vendors/pending')
  @ApiOperation({ summary: 'List pending vendor applications' })
  async pendingVendors() {
    return { success: true, data: await this.adminService.listPendingVendors() };
  }

  @Patch('vendors/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify vendor' })
  async verifyVendor(@Param('id') id: string) {
    return { success: true, data: await this.adminService.verifyVendor(id) };
  }

  @Get('products')
  @ApiOperation({ summary: 'List products' })
  async listProducts(@Query() pagination: PaginationDto, @Query('status') status?: string) {
    return { success: true, data: await this.adminService.listProducts({ ...pagination, status }) };
  }

  @Patch('products/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend product' })
  async suspendProduct(@Param('id') id: string) {
    return { success: true, data: await this.adminService.suspendProduct(id) };
  }

  @Patch('vendors/:id/commission')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update vendor commission' })
  async updateCommission(@Param('id') id: string, @Body('commissionRate') commissionRate: number) {
    return { success: true, data: await this.adminService.updateCommission(id, commissionRate) };
  }
}
