import { Body, Controller, Get, UnauthorizedException, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AvailabilityDto, GoogleTokenDto, LoginDto, RegisterDto, ReverifyDto, SupabaseTokenDto, VerificationDto } from '../common/dtos';
import { AuthenticatedRequest, toSessionUser } from '../common/security';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly users: UsersService) {}
  @Post('google')
  googleLogin(@Body() dto: GoogleTokenDto) { return this.auth.validateGoogleUser(dto.token); }
  @Post('supabase-session')
  supabaseLogin(@Body() dto: SupabaseTokenDto) { return this.auth.exchangeSupabaseSession(dto.accessToken); }
  @Post('register')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('login')
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Post('check-availability')
  availability(@Body() dto: AvailabilityDto) { return this.auth.checkAvailability(dto.email, dto.username); }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: AuthenticatedRequest) {
    const user = await this.users.findOne(req.user.userId);
    if (!user) throw new UnauthorizedException('Cuenta no disponible');
    return toSessionUser(user);
  }
  @UseGuards(JwtAuthGuard)
  @Post('reverify')
  async reverify(@Req() req: AuthenticatedRequest, @Body() dto: ReverifyDto) {
    await this.users.updateStatus(req.user.userId, 'pending', dto.imageBase64);
    return { status: 'ok' };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/pending')
  pending() { return this.users.findPending(); }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/verify/:id')
  async verify(@Param('id', ParseIntPipe) id: number, @Body() dto: VerificationDto) {
    await this.users.updateStatus(id, dto.status, undefined, dto.message);
    return { status: 'success' };
  }
}
