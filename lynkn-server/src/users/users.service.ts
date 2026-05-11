import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
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

  async updateProfile(userId: number, updateData: any) {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        username: updateData.username,
        bio: updateData.bio,
        birth_day: updateData.birth_day,
        foto_perfil: updateData.foto_perfil,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
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