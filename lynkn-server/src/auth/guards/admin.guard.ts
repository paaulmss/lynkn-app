import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('DEBUG GUARD - Usuario en request:', user);

    // Si el usuario existe y es admin, le dejamos pasar
    if (user && user.role === 'admin') {
      return true;
    }

    throw new ForbiddenException('Acceso denegado: Se requiere rol de administrador');
  }
}