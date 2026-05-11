import { Injectable, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
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
    const { email, username, password, foto_perfil, selfie, birth_day } = userData;

    if (!birth_day) {
      throw new BadRequestException('ERR_BIRTH_REQUIRED');
    }

    const birthDate = new Date(birth_day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      throw new BadRequestException('ERR_UNDERAGE');
    }

    const existingUserByEmail = await this.usersService.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('ERR_EMAIL_EXISTS');
    }

    const existingUserByUsername = await this.usersService.findByUsername(username.toLowerCase());
    if (existingUserByUsername) {
      throw new ConflictException('ERR_USERNAME_EXISTS');
    }

    if (password.length < 8) {
      throw new BadRequestException('ERR_PWD_SHORT');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.usersService.create({
      email,
      username: username.toLowerCase(),
      pwd: hashedPassword,
      foto_perfil,
      selfie_real_time: selfie || null,
      birth_day,
      role: 'user',
      status_verif: selfie ? 'pending' : 'unverified',
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

  async checkAvailability(email: string, username: string) {
    const userByEmail = await this.usersService.findByEmail(email);
    if (userByEmail) {
      throw new ConflictException('ERR_EMAIL_EXISTS');
    }

    const userByUsername = await this.usersService.findByUsername(username.toLowerCase());
    if (userByUsername) {
      throw new ConflictException('ERR_USERNAME_EXISTS');
    }

    return { available: true };
  }

  /* LOGIN MANUAL */
  async login(loginData: any) {
    const { identifier, password } = loginData;

    const user = await this.usersService.findByIdentifier(identifier);

    if (!user || !user.pwd) {
      throw new ForbiddenException('ERR_INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.pwd);
    if (!isMatch) {
      throw new ForbiddenException('ERR_INVALID_CREDENTIALS');
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
      throw new ForbiddenException('ERR_GOOGLE_TOKEN_INVALID');
    }
  }
}