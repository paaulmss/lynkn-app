import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Body, 
  Param, 
  BadRequestException, 
  InternalServerErrorException, 
  Logger 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Post('google')
  async googleLogin(@Body('token') token: string) {
    return this.authService.validateGoogleUser(token);
  }

  @Post('register')
  async register(@Body() userData: any) {
    try {
      if (!userData.email || !userData.password) {
        throw new BadRequestException('Email y contraseña son obligatorios');
      }
      return await this.authService.register(userData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error en Registro: ${errorMessage}`);
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginData: any) {
    try {
      return await this.authService.login(loginData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error en Login: ${errorMessage}`);
      throw error;
    }
  }

  @Post('reverify')
  async reverify(@Body() data: { userId: number, imageBase64: string }) {
    try {
      await this.usersService.updateStatus(data.userId, 'pending');
      return { 
        status: 'ok', 
        message: 'Verificación enviada correctamente. Estado: Pendiente.' 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error en Reverify: ${errorMessage}`);
      throw new InternalServerErrorException('No se pudo procesar la reverificación');
    }
  }


  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/pending')
  async getPendingUsers() {
    try {
      return await this.usersService.findPending();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error obteniendo pendientes: ${errorMessage}`);
      throw new InternalServerErrorException('Error al obtener usuarios pendientes');
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/verify/:id')
  async verifyUser(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected'
  ) {
    try {
      await this.usersService.updateStatus(Number(id), status);
      return { status: 'success', message: `Usuario actualizado a ${status}` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error verificando usuario ${id}: ${errorMessage}`);
      throw new InternalServerErrorException('No se pudo actualizar el estado del usuario');
    }
  }
}