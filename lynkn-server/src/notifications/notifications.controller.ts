import { Controller, Get, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get('user/:userId')
  async getByUser(@Param('userId', ParseIntPipe) userId: number) {
    console.log("Solicitando notificaciones para el usuario ID:", userId);
    const result = await this.notificationsService.findByUser(userId);
    console.log("Resultado de la DB:", result);
    return result;
  }

  @Get('user/:userId/unread-count')
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.countUnread(userId);
    return { count };
  }

  @Patch('user/:userId/mark-read')
  async markRead(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }
}