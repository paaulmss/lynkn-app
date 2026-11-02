import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { parseSubject, Principal } from '../../common/security';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }
  async validate(payload: unknown): Promise<Principal> {
    const user = await this.users.findOne(parseSubject(payload));
    if (!user || !['admin', 'user'].includes(user.role)) {
      throw new UnauthorizedException('Cuenta no disponible');
    }
    return { userId: user.id, email: user.email, role: user.role, status: user.status_verif };
  }
}
