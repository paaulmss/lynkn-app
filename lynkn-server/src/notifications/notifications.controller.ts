import { Controller, Get, Patch, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest, assertOwner } from '../common/security';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get('user/:userId')
  list(@Param('userId', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    assertOwner(req.user, id);
    return this.notifications.findByUser(id);
  }
  @Get('user/:userId/unread-count')
  async count(@Param('userId', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    assertOwner(req.user, id);
    return { count: await this.notifications.countUnread(id) };
  }
  @Patch('user/:userId/mark-read')
  mark(@Param('userId', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    assertOwner(req.user, id);
    return this.notifications.markAllAsRead(id);
  }
}
