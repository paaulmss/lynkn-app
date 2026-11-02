import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest, assertOwner } from '../common/security';
import { CreatePostDto, ParticipationDto } from '../common/dtos';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly posts: PostsService) {}
  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 3 * 1024 * 1024, files: 1, fields: 12 } }))
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreatePostDto, @Req() req: AuthenticatedRequest) {
    return this.posts.createPost(file, dto, req.user);
  }
  @Get('categories')
  categories() { return this.posts.findCategories(); }
  @Get()
  all(@Req() req: AuthenticatedRequest, @Query('exclude') exclude?: string) {
    return this.posts.findAll(exclude ? req.user.userId : undefined, req.user.userId);
  }
  @Get('user/:userId')
  byUser(@Param('userId', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.posts.findByUser(id, req.user.userId);
  }
  @Get('favorites/:userId')
  favorites(@Param('userId', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    assertOwner(req.user, id);
    return this.posts.getFavoritePosts(id);
  }
  @Get(':id/social')
  social(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.posts.getPostSocial(id, req.user.userId);
  }
  @Post(':id/favorite')
  favorite(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.posts.addFavorite(id, req.user.userId);
  }
  @Delete(':id/favorite')
  unfavorite(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.posts.removeFavorite(id, req.user.userId);
  }
  @Get('user-requests/:userId')
  requests(@Param('userId', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    assertOwner(req.user, id);
    return this.posts.getUserRequests(id);
  }
  @Post(':id/join')
  join(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.posts.requestJoin(id, req.user.userId);
  }
  @Patch('participation/:id')
  status(@Param('id', ParseIntPipe) id: number, @Body() dto: ParticipationDto, @Req() req: AuthenticatedRequest) {
    return this.posts.updateParticipationStatus(id, dto.status, req.user);
  }
  @Delete('participation/:id')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.posts.deleteParticipation(id, req.user);
  }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.posts.deletePost(id, req.user.userId);
  }
  @Get(':id/participants')
  participants(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) { return this.posts.getParticipants(id, req.user); }
  @Patch('participation-by-notif/:notifId')
  fromNotification(@Param('notifId', ParseIntPipe) id: number, @Body() dto: ParticipationDto, @Req() req: AuthenticatedRequest) {
    return this.posts.handleNotificationAction(id, dto.status, req.user);
  }
}
