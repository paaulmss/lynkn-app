import { Controller, Get, Delete, Put, Param, UseGuards, InternalServerErrorException, Body, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('approved')
  async getApprovedUsers() {
    return await this.usersService.findApproved();
  }

  @Put(':id/preferences')
  async updatePrefs(
    @Param('id', ParseIntPipe) id: number,
    @Body() prefs: { theme: string; language: string }
  ) {
    return this.usersService.updatePreferences(id, prefs.theme, prefs.language);
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