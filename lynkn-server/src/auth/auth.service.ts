import { Injectable, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  private supabase: SupabaseClient;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
    );
  }

  /* REGISTRO */
  async register(userData: any) {
    const { email, username, password, foto_perfil, selfie, birth_day, terms_accepted } = userData;

    if (!birth_day) {
      throw new BadRequestException('ERR_BIRTH_REQUIRED');
    }

    if (terms_accepted !== true) {
      throw new BadRequestException('ERR_TERMS_REQUIRED');
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
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
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
      if (!token || !process.env.GOOGLE_CLIENT_ID) {
        throw new ForbiddenException('ERR_GOOGLE_TOKEN_INVALID');
      }

      const tokenInfo = await this.googleClient.getTokenInfo(token);
      if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID || !tokenInfo.email) {
        throw new ForbiddenException('ERR_GOOGLE_TOKEN_INVALID');
      }

      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userInfoRes.ok) {
        throw new ForbiddenException('ERR_GOOGLE_TOKEN_INVALID');
      }

      const userInfo = await userInfoRes.json() as {
        sub: string;
        email: string;
        email_verified?: boolean;
        name?: string;
        picture?: string;
      };

      if (!userInfo.email_verified || userInfo.email !== tokenInfo.email) {
        throw new ForbiddenException('ERR_GOOGLE_TOKEN_INVALID');
      }

      const { email, sub, name, picture } = userInfo;

      let user = await this.usersService.findByEmail(email);

      if (!user) {
        const username = await this.createUniqueGoogleUsername(name || email);
        user = await this.usersService.create({
          email,
          username,
          google_id: sub,
          foto_perfil: picture,
          role: 'user',
          status_verif: 'unverified',
        } as any);
      } else if (!user.google_id || (!user.foto_perfil && picture)) {
        user = await this.usersService.updateGoogleIdentity(user.id, {
          google_id: sub,
          foto_perfil: user.foto_perfil || picture,
        });
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

  async exchangeSupabaseSession(accessToken: string) {
    if (!accessToken) {
      throw new ForbiddenException('ERR_OTP_SESSION_INVALID');
    }

    const { data, error } = await this.supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new ForbiddenException('ERR_OTP_SESSION_INVALID');
    }

    const authUser = data.user;
    const email = authUser.email?.toLowerCase();
    const phone = authUser.phone || authUser.user_metadata?.phone;

    let user = await this.usersService.findBySupabaseAuthId(authUser.id);

    if (!user && email) {
      user = await this.usersService.findByEmail(email);
    }

    if (!user && phone) {
      user = await this.usersService.findByPhone(phone);
    }

    if (!user) {
      const username = await this.createUniquePasswordlessUsername(email || phone || authUser.id);
      user = await this.usersService.create({
        email: email || `${this.normalizePhoneForEmail(phone || authUser.id)}@phone.lynkn.local`,
        username,
        phone: phone || null,
        supabase_auth_id: authUser.id,
        foto_perfil: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`,
        role: 'user',
        status_verif: 'unverified',
      } as any);
    } else if (!user.supabase_auth_id || (phone && !user.phone)) {
      user = await this.usersService.updatePasswordlessIdentity(user.id, {
        supabase_auth_id: authUser.id,
        phone,
      });
    }

    return this.createSessionResponse(user);
  }

  private async createUniqueGoogleUsername(seed: string) {
    const baseUsername = seed
      .split('@')[0]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24) || 'google_user';

    let username = baseUsername;
    let suffix = 1;

    while (await this.usersService.findByUsername(username)) {
      username = `${baseUsername}_${suffix}`;
      suffix += 1;
    }

    return username;
  }

  private async createUniquePasswordlessUsername(seed: string) {
    const baseUsername = seed.includes('@')
      ? seed.split('@')[0]
      : `user_${this.normalizePhoneForEmail(seed).slice(-8)}`;

    return this.createUniqueGoogleUsername(baseUsername);
  }

  private normalizePhoneForEmail(value: string) {
    return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'phone_user';
  }

  private createSessionResponse(user: any) {
    const jwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role || user['role'],
      status: user.status_verif || user['status_verif'],
    };

    return {
      access_token: this.jwtService.sign(jwtPayload),
      user,
    };
  }
}
