import { Controller, Get, Param, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/security';
import { ChatHistoryQueryDto } from '../common/dtos';
import { ChatService } from './chat.service';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chats: ChatService) {}
  @Get()
  events(@Req() req: AuthenticatedRequest) { return this.chats.events(req.user.userId); }
  @Get(':id/messages')
  history(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest, @Query() query: ChatHistoryQueryDto) {
    return this.chats.history(id, req.user.userId, query.before);
  }
}
