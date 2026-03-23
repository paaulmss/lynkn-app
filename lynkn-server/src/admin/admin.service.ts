import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AdminService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }

  // Obtener usuarios pendientes de aprobación
  async getPendingUsers() {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, email, foto_perfil, selfie_real_time, status_verif')
      .eq('status_verif', 'pending');

    if (error) throw error;
    return data;
  }

  // Aprobar o rechazar a un usuario
  async updateVerificationStatus(id: number, status: 'approved' | 'rejected') {
    const { data, error } = await this.supabase
      .from('users')
      .update({ status_verif: status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}