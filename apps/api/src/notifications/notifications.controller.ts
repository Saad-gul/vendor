import { Controller, Get, Patch, Param, UseGuards, HttpCode, HttpStatus, Sse } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { interval, map, Observable } from 'rxjs';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async findAll(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.notificationsService.findByUser(userId) };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return { success: true, data: await this.notificationsService.markAsRead(userId, id) };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.notificationsService.markAllAsRead(userId) };
  }

  @Sse('stream')
  stream(@CurrentUser('sub') userId: string): Observable<{ data: string }> {
    return interval(30000).pipe(map(() => ({ data: JSON.stringify({ userId, ping: true }) })));
  }
}
