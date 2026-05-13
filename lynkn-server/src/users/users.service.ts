import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;
  private readonly safetyModel?: any;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.safetyModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }

  // Buscar usuario por email
  async findByEmail(email: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error Supabase findByEmail:', error.message);
      throw error;
    }

    if (data) {
      console.log(`Usuario encontrado: ${data.email}, Rol: ${data.role}, Status: ${data.status_verif}`);
    }

    return data;
  }

  // Crear un nuevo usuario
  async create(userData: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('Error de Supabase al crear usuario:', error.message, 'Código:', error.code);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  // Buscar por ID
  async findOne(id: number): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateStatus(id: number, status: string, selfieBase64?: string, adminMessage?: string): Promise<void> {
    const updateData: any = {
      status_verif: status,
      verif_message: adminMessage
    };

    if (selfieBase64) {
      updateData.selfie_real_time = selfieBase64;
    }

    const { error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  // Buscar usuarios aprobados para el mapa
  async findApproved() {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, foto_perfil, lat, lng, bio')
      .eq('status_verif', 'approved');

    if (error) throw error;
    return data;
  }

  async findPublicProfile(userId: number) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, email, foto_perfil, bio, location, status_verif, role')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw new InternalServerErrorException(error.message);
    if (!data) throw new BadRequestException('Usuario no encontrado');
    return data;
  }

  async searchUsers(query: string, viewerId?: number) {
    const normalized = String(query || '').trim().toLowerCase().replace(/[%,()]/g, '');
    if (normalized.length < 2) return [];

    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, foto_perfil, bio, location, status_verif')
      .eq('status_verif', 'approved')
      .or(`username.ilike.%${normalized}%,bio.ilike.%${normalized}%,location.ilike.%${normalized}%`)
      .limit(12);

    if (error) throw new InternalServerErrorException(error.message);
    return this.enrichUsersWithSocial(data || [], viewerId);
  }

  private async enrichUsersWithSocial(users: any[], viewerId?: number) {
    if (!users.length) return users;

    const userIds = users.map((user) => user.id);
    const [followersRes, followingRes, viewerFollowingRes] = await Promise.all([
      this.supabase
        .from('user_follows')
        .select('following_id')
        .in('following_id', userIds),
      this.supabase
        .from('user_follows')
        .select('follower_id')
        .in('follower_id', userIds),
      viewerId
        ? this.supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', viewerId)
            .in('following_id', userIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (followersRes.error) throw new InternalServerErrorException(followersRes.error.message);
    if (followingRes.error) throw new InternalServerErrorException(followingRes.error.message);
    if (viewerFollowingRes.error) throw new InternalServerErrorException(viewerFollowingRes.error.message);

    const followersMap = new Map<number, number>();
    const followingMap = new Map<number, number>();
    const viewerFollowingSet = new Set<number>();

    (followersRes.data || []).forEach((row: any) => {
      followersMap.set(row.following_id, (followersMap.get(row.following_id) || 0) + 1);
    });

    (followingRes.data || []).forEach((row: any) => {
      followingMap.set(row.follower_id, (followingMap.get(row.follower_id) || 0) + 1);
    });

    (viewerFollowingRes.data || []).forEach((row: any) => {
      viewerFollowingSet.add(row.following_id);
    });

    return users.map((user) => ({
      ...user,
      followers: followersMap.get(user.id) || 0,
      following: followingMap.get(user.id) || 0,
      is_following: viewerFollowingSet.has(user.id),
    }));
  }

  async getSocialStats(userId: number, viewerId?: number) {
    const [followersRes, followingRes, isFollowingRes] = await Promise.all([
      this.supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
      this.supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId),
      viewerId
        ? this.supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', viewerId)
            .eq('following_id', userId)
            .single()
        : Promise.resolve({ data: null, error: null } as any),
    ]);

    if (followersRes.error) throw new InternalServerErrorException(followersRes.error.message);
    if (followingRes.error) throw new InternalServerErrorException(followingRes.error.message);
    if (isFollowingRes.error && isFollowingRes.error.code !== 'PGRST116') {
      throw new InternalServerErrorException(isFollowingRes.error.message);
    }

    return {
      user_id: userId,
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
      is_following: Boolean(isFollowingRes.data),
    };
  }

  async followUser(followerId: number, followingId: number) {
    if (Number(followerId) === Number(followingId)) {
      return this.getSocialStats(followingId, followerId);
    }

    const { error } = await this.supabase
      .from('user_follows')
      .upsert([{ follower_id: followerId, following_id: followingId }], {
        onConflict: 'follower_id,following_id',
      });

    if (error) throw new InternalServerErrorException(error.message);
    return this.getSocialStats(followingId, followerId);
  }

  async unfollowUser(followerId: number, followingId: number) {
    const { error } = await this.supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw new InternalServerErrorException(error.message);
    return this.getSocialStats(followingId, followerId);
  }

  async getFollowList(userId: number, type: 'followers' | 'following', viewerId?: number) {
    const isFollowers = type === 'followers';
    const { data: follows, error } = await this.supabase
      .from('user_follows')
      .select('follower_id, following_id')
      .eq(isFollowers ? 'following_id' : 'follower_id', userId);

    if (error) throw new InternalServerErrorException(error.message);

    const ids = Array.from(new Set((follows || []).map((row: any) => isFollowers ? row.follower_id : row.following_id)));
    if (!ids.length) return [];

    const { data: users, error: usersError } = await this.supabase
      .from('users')
      .select('id, username, foto_perfil, bio, location, status_verif')
      .in('id', ids);

    if (usersError) throw new InternalServerErrorException(usersError.message);
    return this.enrichUsersWithSocial(users || [], viewerId);
  }

  async findPending() {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, email, foto_perfil, selfie_real_time, status_verif')
      .eq('status_verif', 'pending');

    if (error) throw error;
    return data;
  }

  async findByUsername(username: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') return null;
    return data;
  }

  async findByIdentifier(identifier: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .or(`email.eq.${identifier},username.eq.${identifier.toLowerCase()}`)
      .single();

    if (error) return null;
    return data;
  }

  async findByPhone(phone: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  async findBySupabaseAuthId(authId: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('supabase_auth_id', authId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  async updateGoogleIdentity(userId: number, googleData: { google_id: string; foto_perfil?: string }) {
    const updateData: Record<string, string> = {
      google_id: googleData.google_id,
    };

    if (googleData.foto_perfil) {
      updateData.foto_perfil = googleData.foto_perfil;
    }

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updatePasswordlessIdentity(userId: number, identityData: { supabase_auth_id: string; email?: string; phone?: string }) {
    const updateData: Record<string, string> = {
      supabase_auth_id: identityData.supabase_auth_id,
    };

    if (identityData.email) updateData.email = identityData.email;
    if (identityData.phone) updateData.phone = identityData.phone;

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateProfile(userId: number, updateData: any) {
    const username = String(updateData.username || '').trim().toLowerCase();
    const bio = String(updateData.bio || '').trim();
    const location = String(updateData.location || '').trim();
    const fotoPerfil = updateData.foto_perfil || null;

    if (!username) {
      throw new BadRequestException('El nombre de usuario es obligatorio');
    }

    if (username.length > 25 || bio.length > 160 || location.length > 50) {
      throw new BadRequestException('Los datos del perfil superan el límite permitido');
    }

    const existingUser = await this.findByUsername(username);
    if (existingUser && Number(existingUser.id) !== Number(userId)) {
      throw new ConflictException('ERR_USERNAME_EXISTS');
    }

    await this.ensureProfileContentIsSafe({ username, bio, location });

    const { data, error } = await this.supabase
      .from('users')
      .update({
        username,
        bio,
        location,
        birth_day: updateData.birth_day,
        foto_perfil: fotoPerfil,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  private async ensureProfileContentIsSafe(content: { username: string; bio: string; location: string }) {
    const combinedText = [
      `username: ${content.username}`,
      `bio: ${content.bio || '(empty)'}`,
      `location: ${content.location || '(empty)'}`,
    ].join('\n');

    if (this.hasClearlyUnsafeText(combinedText)) {
      throw new BadRequestException('PROFILE_CONTENT_REJECTED');
    }

    if (!this.safetyModel) return;

    try {
      const prompt = `Revisa estos campos públicos de perfil de una red social de eventos.
Marca como RECHAZADO si contienen odio, acoso, amenazas, contenido sexual explícito, explotación, violencia gráfica, venta de drogas/armas, spam o datos personales sensibles de terceros.
Marca como APROBADO si son seguros.
Responde únicamente APROBADO o RECHAZADO.

${combinedText}`;

      const result = await this.safetyModel.generateContent(prompt);
      const response = await result.response;
      const verdict = response.text().trim().toUpperCase();

      if (verdict.includes('RECHAZADO')) {
        throw new BadRequestException('PROFILE_CONTENT_REJECTED');
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error moderando perfil con IA:', error);
      throw new InternalServerErrorException('No se pudo moderar el perfil');
    }
  }

  private hasClearlyUnsafeText(text: string) {
    const normalized = text.toLowerCase();
    const blockedPatterns = [
      /\b(kill\s+yourself|kys)\b/i,
      /\b(suic[ií]date|m[aá]tate)\b/i,
      /\b(nazi|nazis)\b/i,
      /\b(terrorismo|terrorist|bomba|bomb)\b/i,
      /\b(cocaine|coca[ií]na|hero[ií]na|meth|metanfetamina)\b/i,
    ];

    return blockedPatterns.some((pattern) => pattern.test(normalized));
  }

  async updatePreferences(userId: number, theme: string, language: string) {
  const { data, error } = await this.supabase
    .from("users")
    .update({ theme, language })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new InternalServerErrorException(error.message);
  return data;
}

  async deleteAccount(userId: number): Promise<void> {
  const { error: postError } = await this.supabase
    .from('posts')
    .delete()
    .eq('user_id', userId);
  if (postError) throw postError;

  await this.supabase.from('messages').delete().eq('sender_id', userId);
  await this.supabase.from('chats').delete().eq('user_id', userId);

  await this.supabase.from('notifications').delete().eq('user_id', userId);

  const { error: userError } = await this.supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (userError) {
    console.error('Error al borrar usuario:', userError.message);
    throw userError;
  }
}
}
