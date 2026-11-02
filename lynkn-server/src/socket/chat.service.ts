import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class ChatService {
  constructor(private readonly database: SupabaseService) {}
  private get db() { return this.database.getClient(); }
  async canAccess(postId: number, userId: number): Promise<boolean> {
    const { data: post, error } = await this.db.from('posts').select('user_id').eq('id', postId).maybeSingle();
    if (error) throw new InternalServerErrorException('No se pudo comprobar el chat');
    if (!post) return false;
    if (Number(post.user_id) === userId) return true;
    const { data, error: partError } = await this.db.from('participations').select('id')
      .eq('post_id', postId).eq('user_id', userId).eq('status', 'accepted').maybeSingle();
    if (partError) throw new InternalServerErrorException('No se pudo comprobar el chat');
    return Boolean(data);
  }
  async assertAccess(postId: number, userId: number) {
    if (!await this.canAccess(postId, userId)) throw new ForbiddenException('No tienes acceso a este chat');
  }
  async events(userId: number) {
    const [participations, owned] = await Promise.all([
      this.db.from('participations').select('posts(id, title, max_particip)').eq('user_id', userId).eq('status', 'accepted'),
      this.db.from('posts').select('id, title, max_particip').eq('user_id', userId),
    ]);
    if (participations.error || owned.error) throw new InternalServerErrorException('No se pudieron cargar los chats');
    const rows = [...(owned.data || []), ...(participations.data || []).flatMap((row) =>
      Array.isArray(row.posts) ? row.posts : row.posts ? [row.posts] : [])];
    return [...new Map(rows.map((row) => [row.id, row])).values()];
  }
  async history(postId: number, userId: number, before?: number) {
    await this.assertAccess(postId, userId);
    let query = this.db.from("messages").select("*, users(username, foto_perfil)").eq("post_id", postId);
    if (before !== undefined) query = query.lt("id", before);
    const [messages, participants, post] = await Promise.all([
      query.order('id', { ascending: false }).limit(201),
      this.db.from('participations').select('users(username)').eq('post_id', postId).eq('status', 'accepted'),
      this.db.from('posts').select('users(username)').eq('id', postId).maybeSingle(),
    ]);
    if (messages.error || participants.error || post.error) throw new InternalServerErrorException('No se pudo cargar el historial');
    if (!post.data) throw new NotFoundException('Chat no encontrado');
    const names = [...(participants.data || []), post.data].flatMap((row) =>
      Array.isArray(row.users) ? row.users.map((user) => user.username) : row.users ? [(row.users as { username: string }).username] : []);
    const page = (messages.data || []).slice(0, 200).reverse();
    return { messages: page, participants: [...new Set(names)], hasMore: (messages.data?.length || 0) > 200, nextCursor: page[0]?.id ?? null };
  }
  async save(postId: number, senderId: number, content: string) {
    await this.assertAccess(postId, senderId);
    const { data, error } = await this.db.from('messages').insert({
      post_id: postId, sender_id: senderId, content: content.trim(),
    }).select('*, users(username, foto_perfil)').single();
    if (error) throw new InternalServerErrorException('No se pudo guardar el mensaje');
    return data;
  }
}
