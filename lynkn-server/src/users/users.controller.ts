import { Body, Controller, Delete, ForbiddenException, Get, InternalServerErrorException, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('approved')
  async getApprovedUsers() {
    return await this.usersService.findApproved();
  }

  @Get('search')
  async searchUsers(
    @Query('q') query = '',
    @Query('viewerId') viewerId?: string
  ) {
    return this.usersService.searchUsers(query, viewerId ? parseInt(viewerId) : undefined);
  }

  @Get(':id/social')
  async getSocialStats(
    @Param('id', ParseIntPipe) id: number,
    @Query('viewerId') viewerId?: string
  ) {
    return this.usersService.getSocialStats(id, viewerId ? parseInt(viewerId) : undefined);
  }

  @Get(':id/followers')
  async getFollowers(
    @Param('id', ParseIntPipe) id: number,
    @Query('viewerId') viewerId?: string
  ) {
    return this.usersService.getFollowList(id, 'followers', viewerId ? parseInt(viewerId) : undefined);
  }

  @Get(':id/following')
  async getFollowing(
    @Param('id', ParseIntPipe) id: number,
    @Query('viewerId') viewerId?: string
  ) {
    return this.usersService.getFollowList(id, 'following', viewerId ? parseInt(viewerId) : undefined);
  }

  @Post(':id/follow')
  async followUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('followerId') followerId: number
  ) {
    return this.usersService.followUser(followerId, id);
  }

  @Delete(':id/follow')
  async unfollowUser(
    @Param('id', ParseIntPipe) id: number,
    @Query('followerId', ParseIntPipe) followerId: number
  ) {
    return this.usersService.unfollowUser(followerId, id);
  }

  @Put(':id/preferences')
  async updatePrefs(
    @Param('id', ParseIntPipe) id: number,
    @Body() prefs: { theme: string; language: string }
  ) {
    return this.usersService.updatePreferences(id, prefs.theme, prefs.language);
  }

  @Get(':id')
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findPublicProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/profile')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() profileData: any
  ) {
    if (Number(req.user?.userId) !== Number(id) && req.user?.role !== 'admin') {
      throw new ForbiddenException('No puedes editar este perfil');
    }

    return this.usersService.updateProfile(id, profileData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteAccount(@Param('id') id: string) {
    try {
      await this.usersService.deleteAccount(Number(id));
      return { status: 'success', message: 'Cuenta eliminada permanentemente' };
    } catch (error) {
      throw new InternalServerErrorException('No se pudo eliminar la cuenta');
    }
  }
}
