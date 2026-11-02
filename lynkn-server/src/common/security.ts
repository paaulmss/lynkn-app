import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export type Role = 'admin' | 'user';
export interface Principal { userId: number; email: string; role: Role; status: string; }
export interface AuthenticatedRequest { user: Principal; }

export function assertOwner(actor: Principal, ownerId: number): void {
  if (actor.userId !== ownerId && actor.role !== 'admin') {
    throw new ForbiddenException('No tienes permiso sobre este recurso');
  }
}

export function parseSubject(payload: unknown): number {
  if (!payload || typeof payload !== 'object' || !('sub' in payload) ||
      typeof payload.sub !== 'number' || !Number.isSafeInteger(payload.sub) || payload.sub <= 0) {
    throw new UnauthorizedException('Token invalido');
  }
  return payload.sub;
}

/** Explicit output contract: never serialize the database row directly. */
export function toSessionUser(user: Record<string, unknown>) {
  const id = user.id;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) throw new UnauthorizedException('Usuario invalido');
  return {
    id,
    email: typeof user.email === 'string' ? user.email : '',
    username: typeof user.username === 'string' ? user.username : '',
    foto_perfil: typeof user.foto_perfil === 'string' ? user.foto_perfil : '',
    birth_day: typeof user.birth_day === 'string' ? user.birth_day : null,
    bio: typeof user.bio === 'string' ? user.bio : '',
    location: typeof user.location === 'string' ? user.location : '',
    verif_message: typeof user.verif_message === 'string' ? user.verif_message : '',
    theme: user.theme === 'light' ? 'light' as const : 'dark' as const,
    language: user.language === 'en' ? 'en' as const : 'es' as const,
    role: user.role === 'admin' ? 'admin' as const : 'user' as const,
    status_verif: user.status_verif === 'approved' ? 'approved' as const :
      user.status_verif === 'pending' ? 'pending' as const :
      user.status_verif === 'rejected' ? 'rejected' as const : 'unverified' as const,
  };
}

export function relationOne<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
