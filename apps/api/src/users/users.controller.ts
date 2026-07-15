import { Controller, Get, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.usersService.findById(userId) };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return { success: true, data: await this.usersService.updateProfile(userId, dto) };
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async updatePassword(@CurrentUser('sub') userId: string, @Body() dto: UpdatePasswordDto) {
    return { success: true, data: await this.usersService.updatePassword(userId, dto) };
  }

  @Get('me/address')
  @ApiOperation({ summary: 'Get shipping address' })
  async getAddress(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.usersService.getAddress(userId) };
  }

  @Patch('me/address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update shipping address' })
  async updateAddress(@CurrentUser('sub') userId: string, @Body() dto: UpdateAddressDto) {
    return { success: true, data: await this.usersService.updateAddress(userId, dto) };
  }
}
