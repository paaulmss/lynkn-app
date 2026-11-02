import { BadRequestException, ConflictException, ForbiddenException, InternalServerErrorException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
export function throwDatabaseError(error: { code?: string; message?: string }): never {
  switch (error.code) {
    case '42501': throw new ForbiddenException('Operacion no permitida');
    case 'P0002': throw new NotFoundException('Recurso no encontrado');
    case '23505': throw new ConflictException('El recurso ya existe');
    case '23514': throw new ConflictException('El evento esta completo');
    case '22023': throw new BadRequestException('Operacion no valida');
    case 'PGRST202': case '42883':
      throw new ServiceUnavailableException('Database workflows are not installed');
    default: throw new InternalServerErrorException('No se pudo completar la operacion');
  }
}
