import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest, assertOwner, toSessionUser } from '../common/security';
import { PreferencesDto, ProfileDto, SearchDto } from '../common/dtos';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get('approved')
  approved() { return this.users.findApproved(); }
  @Get('search')
  search(@Query() dto: SearchDto, @Req() req: AuthenticatedRequest) {
    return this.users.searchUsers(dto.q, req.user.userId);
  }
  @Get(':id/social')
  social(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.users.getSocialStats(id, req.user.userId);
  }
  @Get(':id/followers')
  followers(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.users.getFollowList(id, 'followers', req.user.userId);
  }
  @Get(':id/following')
  following(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.users.getFollowList(id, 'following', req.user.userId);
  }
  @Post(':id/follow')
  follow(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.users.followUser(req.user.userId, id);
  }
  @Delete(':id/follow')
  unfollow(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.users.unfollowUser(req.user.userId, id);
  }
  @Put(':id/preferences')
  async preferences(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest, @Body() dto: PreferencesDto) {
    assertOwner(req.user, id);
    return toSessionUser(await this.users.updatePreferences(id, dto.theme, dto.language));
  }
  @Get(':id')
  profile(@Param('id', ParseIntPipe) id: number) { return this.users.findPublicProfile(id); }
  @Put(':id/profile')
  async update(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest, @Body() dto: ProfileDto) {
    assertOwner(req.user, id);
    return toSessionUser(await this.users.updateProfile(id, dto));
  }
  @Delete(':id')
  async deleteAccount(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    assertOwner(req.user, id);
    await this.users.deleteAccount(id);
    return { status: 'success' };
  }
}
