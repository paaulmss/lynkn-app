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

  @Get('dashboard')
  async dashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  async listUsers() {
    return this.adminService.getUsers();
  }

  @Get('posts')
  async listPosts() {
    return this.adminService.getPosts();
  }

  @Get('reports')
  async listReports() {
    return this.adminService.getReports();
  }

  @Patch('verify/:id')
  async verifyUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'approved' | 'rejected' | 'pending' | 'unverified',
    @Body('message') message?: string,
  ) {
    return this.adminService.updateVerificationStatus(id, status, message);
  }

  @Patch('users/:id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: 'admin' | 'user',
  ) {
    return this.adminService.updateUserRole(id, role);
  }

  @Patch('posts/:id/visibility')
  async updatePostVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body('is_visible') isVisible: boolean,
  ) {
    return this.adminService.updatePostVisibility(id, isVisible);
  }
}
