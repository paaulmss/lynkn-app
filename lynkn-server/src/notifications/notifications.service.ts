import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabaseService: SupabaseService) { }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findByUser(userId: number) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select(`
      *,
      sender:sender_id (username, foto_perfil),
      posts:post_id (title)
    `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(payload: {
    userId: number;      
    senderId: number;    
    postId: number;      
    type: 'join_request' | 'accepted' | 'rejected' | 'info_pending';
  }) {
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        sender_id: payload.senderId,
        post_id: payload.postId,
        type: payload.type,
        is_read: false,
      });

    if (error) {
      console.error("Error creando notificación:", error.message);
    }
  }

  async countUnread(userId: number) {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new InternalServerErrorException(error.message);
    return count || 0;
  }

  async markAllAsRead(userId: number) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }
}