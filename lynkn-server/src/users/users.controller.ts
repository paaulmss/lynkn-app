import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('approved')
  async getApprovedUsers() {
    return await this.usersService.findApproved();
  }
}