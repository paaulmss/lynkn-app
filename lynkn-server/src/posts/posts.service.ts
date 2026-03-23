import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Servicio encargado de la lógica de persistencia y gestión de publicaciones
 */
@Injectable()
export class PostsService {
  private supabase: SupabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
  );

  /**
   * Procesa la creación de un nuevo post y la carga de su imagen asociada.
   */
  async createPost(file: Express.Multer.File, body: any) {
    let imageUrl: string | null = null;

    if (file) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Carga del recurso en el bucket de almacenamiento
      const { error: uploadError } = await this.supabase.storage
        .from('post_images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        throw new InternalServerErrorException(`Fallo en la carga del recurso: ${uploadError.message}`);
      }

      // Generación del enlace público persistente
      const { data } = this.supabase.storage
        .from('post_images')
        .getPublicUrl(filePath);

      imageUrl = data.publicUrl;
    }

    /**
     * Inserción de metadatos en la base de datos relacional
     */
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
          event_date: new Date().toISOString(),
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

  /**
   * Recupera el feed global de publicaciones con información del creador (Join)
   */
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

  /**
   * Recupera las publicaciones específicas de un perfil de usuario
   */
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
}