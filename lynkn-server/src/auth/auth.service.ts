import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  /* REGISTRO */
  async register(userData: any) {
    const { email, username, password, foto_perfil, selfie } = userData;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.usersService.create({
      email,
      username: username.toLowerCase(),
      pwd: hashedPassword,
      foto_perfil: foto_perfil,
      selfie_real_time: selfie,
      role: 'user',
      status_verif: 'pending',
    } as any);

    const jwtPayload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser['role'],
      status: newUser['status_verif']
    };

    return {
      access_token: this.jwtService.sign(jwtPayload),
      user: newUser,
    };
  }

  /* LOGIN MANUAL */
  async login(loginData: any) {
    const { email, password } = loginData;
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.pwd) {
      throw new ForbiddenException('Credenciales incorrectas');
    }

    const isMatch = await bcrypt.compare(password, user.pwd);
    if (!isMatch) {
      throw new ForbiddenException('Credenciales incorrectas');
    }

    //Solo los 'admin' se saltan el estado 'pending'
    if (user['role'] !== 'admin' && user['status_verif'] !== 'approved') {
      throw new ForbiddenException('Tu cuenta está pendiente de aprobación.');
    }

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      role: user['role'],
      status: user['status_verif']
    };

    return {
      access_token: this.jwtService.sign(jwtPayload),
      user,
    };
  }

  /* GOOGLE LOGIN */
  async validateGoogleUser(token: string) {
    try {
      const userInfoRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
      const { email, sub, name, picture } = userInfoRes.data;

      let user = await this.usersService.findByEmail(email);

      if (!user) {
        user = await this.usersService.create({
          email,
          username: name.replace(/\s+/g, '').toLowerCase(),
          google_id: sub,
          foto_perfil: picture,
          role: 'user',
          status_verif: 'pending',
        } as any);
      }

      // Verificación de estado o rol
      if (user['role'] !== 'admin' && user['status_verif'] !== 'approved') {
        return {
          access_token: null,
          user,
          message: 'Cuenta pendiente de aprobación'
        };
      }

      const jwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role || user['role'],
        status: user.status_verif || user['status_verif']
      };

      return {
        access_token: this.jwtService.sign(jwtPayload),
        user,
      };
    } catch (error) {
      throw new ForbiddenException('Token de Google no válido');
    }
  }
}