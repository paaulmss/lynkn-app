import { Injectable } from '@nestjs/common';
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

    if (error) throw error;
    return data;
  }

  // Buscar por ID
  async findOne(id: number): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar el estado de verificación
  async updateStatus(id: number, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ status_verif: status })
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
}