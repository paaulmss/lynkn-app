import { Controller, Get, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pending')
  async listPending() {
    return this.adminService.getPendingUsers();
  }

  @Patch('verify/:id')
  async verifyUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'approved' | 'rejected',
  ) {
    return this.adminService.updateVerificationStatus(id, status);
  }
}