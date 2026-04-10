import { Express } from 'express';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class PostsService {

  constructor(private readonly supabaseService: SupabaseService) { }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  /**
   * Método privado para generar notificaciones en la tabla correspondiente
   */
  private async createNotification(userId: number, senderId: number, postId: number, type: string) {
    const { error } = await this.supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          sender_id: senderId,
          post_id: postId,
          type: type,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) console.error("Error al crear notificación:", error.message);
  }

  /**
   * Procesa la creación de un nuevo post y la carga de su imagen asociada.
   */
  async createPost(file: Express.Multer.File, body: any) {
    let imageUrl: string | null = null;

    if (file) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('post_images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        throw new InternalServerErrorException(`Fallo en la carga del recurso: ${uploadError.message}`);
      }

      const { data } = this.supabase.storage
        .from('post_images')
        .getPublicUrl(filePath);

      imageUrl = data.publicUrl;
    }

    const { data: post, error: dbError } = await this.supabase
      .from('posts')
      .insert([
        {
          title: body.title,
          description: body.description,
          image_url: imageUrl,
          user_id: parseInt(body.user_id),
          lat: parseFloat(body.lat) || 40.4167,
          lng: parseFloat(body.lng) || -3.7037,
          max_particip: parseInt(body.max_particip) || 10,
          category: body.category || 'general',
          event_date: body.event_date || new Date().toISOString(),
          status: 'active',
          is_visible: true,
          moderation_status: 'pending'
        },
      ])
      .select();

    if (dbError) {
      throw new InternalServerErrorException(`Error en la persistencia de datos: ${dbError.message}`);
    }

    return post;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('posts')
      .select(`
        *,
        users (username, foto_perfil) 
      `)
      .eq('is_visible', true)
      .order('id', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data || [];
  }

  async findByUser(userId: number) {
    const { data, error } = await this.supabase
      .from('posts')
      .select(`
        *,
        users (username, foto_perfil) 
      `)
      .eq('user_id', userId)
      .eq('is_visible', true)
      .order('id', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data || [];
  }

  /**
   * 1. REGISTRO DE SOLICITUD
   */
  async requestJoin(postId: number, userId: number) {
    // Insertamos la participación
    const { data: participation, error } = await this.supabase
      .from('participations')
      .insert([{ post_id: postId, user_id: userId, status: 'pending' }])
      .select('*, posts(user_id, title)')
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    if (participation && participation.posts) {
      // NOTIFICACIÓN AL DUEÑO: "X quiere unirse a tu actividad"
      await this.createNotification(
        participation.posts.user_id, // Receptor (Dueño)
        userId,                      // Remitente (Solicitante)
        postId,
        'join_request'
      );

      // NOTIFICACIÓN AL SOLICITANTE
      await this.createNotification(
        userId,                      // Receptor (Solicitante)
        participation.posts.user_id, // Remitente (Dueño)
        postId,
        'info_pending'
      );
    }

    return participation;
  }

  async getParticipants(postId: number) {
    const { data, error } = await this.supabase
      .from('participations')
      .select(`
        id,
        status,
        user_id,
        users (username, foto_perfil)
      `)
      .eq('post_id', postId);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /**
   * 2. ACTUALIZACIÓN DE ESTADO (Aceptar/Rechazar)
   */

  async updateParticipationStatus(participationId: number, status: 'accepted' | 'rejected') {
    // 1. Actualizar el estado en la tabla de participaciones
    const { data: part, error } = await this.supabase
      .from('participations')
      .update({ status })
      .eq('id', participationId)
      .select('*, posts(user_id, title)')
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    if (part) {
      await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', part.posts.user_id) // ID (dueño)
        .eq('post_id', part.post_id)       // El post
        .eq('sender_id', part.user_id)     // El usuario que solicitó
        .eq('type', 'join_request');       // Solo borramos la petición

      // 3. EL FEEDBACK: Creamos la notificación para el usuario que pidió unirse.
      await this.createNotification(
        part.user_id,        // Receptor: El invitado
        part.posts.user_id,  // Remitente: Tú
        part.post_id,
        status               // 'accepted' o 'rejected'
      );

      if (status === 'accepted') {
        await this.supabase.rpc('increment_participant', { row_id: part.post_id });
      }
    }

    return part;
  }
}