import { throwDatabaseError } from '../common/database-error';
import { randomUUID } from 'crypto';
import { moderatePost } from './post-moderation';
import { CreatePostDto } from '../common/dtos';
import { assertOwner, Principal, relationOne } from '../common/security';
import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../supabase.service";

@Injectable()
export class PostsService {
  constructor(private readonly supabaseService: SupabaseService) { }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findCategories() {
    const { data, error } = await this.supabase
      .from("event_categories")
      .select("slug, label_es, label_en, icon, color, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data || [];
  }

  async categoryExists(slug: string) {
    const { data, error } = await this.supabase
      .from("event_categories")
      .select("slug")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new InternalServerErrorException(error.message);
    }

    return Boolean(data);
  }

  private async enrichPostsSocial<T extends { id: number }>(posts: T[], viewerId?: number) {
    if (!posts.length) return posts;

    const postIds = posts.map((post) => post.id);
    const { data: favorites, error } = await this.supabase
      .from("post_favorites")
      .select("post_id, user_id")
      .in("post_id", postIds);

    if (error) throw new InternalServerErrorException(error.message);

    const countMap = new Map<number, number>();
    const viewerFavoriteSet = new Set<number>();

    (favorites || []).forEach((favorite) => {
      countMap.set(favorite.post_id, (countMap.get(favorite.post_id) || 0) + 1);
      if (viewerId && Number(favorite.user_id) === Number(viewerId)) {
        viewerFavoriteSet.add(favorite.post_id);
      }
    });

    return posts.map((post) => ({
      ...post,
      favorite_count: countMap.get(post.id) || 0,
      is_favorited: viewerFavoriteSet.has(post.id),
    }));
  }

  async createPost(file: Express.Multer.File, body: CreatePostDto, actor: Principal) {
    if (actor.role !== 'admin' && actor.status !== 'approved') throw new ForbiddenException('Cuenta pendiente de verificacion');
    if (!file) throw new BadRequestException('La imagen es obligatoria');
    const bytes = file.buffer;
    const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    const detectedType = png ? 'image/png' : jpeg ? 'image/jpeg' : webp ? 'image/webp' : null;
    if (!detectedType || bytes.length > 3 * 1024 * 1024) throw new BadRequestException('Imagen no valida');
    file.mimetype = detectedType;
    await moderatePost(bytes, detectedType, body.title, body.description);
    let imageUrl: string | null = null;
    const requestedCategory = String(body.category || "general").trim();
    const category = await this.categoryExists(requestedCategory)
      ? requestedCategory
      : "general";

    if (file) {
      const fileExt = file.mimetype === "image/png" ? "png" : file.mimetype === "image/webp" ? "webp" : "jpg";
      const fileName = `${randomUUID()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from("post_images")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw new InternalServerErrorException(
          `Fallo en la carga de imagen: ${uploadError.message}`,
        );
      }

      const { data } = this.supabase.storage
        .from("post_images")
        .getPublicUrl(filePath);

      imageUrl = data.publicUrl;
    }

    const { data, error } = await this.supabase.rpc('lynkn_create_post', {
      p_actor_id: actor.userId,
      p_payload: {
        ...body, image_url: imageUrl, category,
        max_particip: body.max_participants ?? 0,
      },
    });
    if (error) {
      if (imageUrl) {
        const path = new URL(imageUrl).pathname.split('/post_images/')[1];
        if (path) await this.supabase.storage.from('post_images').remove([decodeURIComponent(path)]);
      }
      throwDatabaseError(error);
    }
    return data;
  }

  async findAll(excludeUserId?: number, viewerId?: number) {
    let query = this.supabase
      .from("posts")
      .select("*, users (username, foto_perfil)")
      .eq("is_visible", true);

    if (excludeUserId) {
      query = query.neq("user_id", excludeUserId);
    }

    const { data, error } = await query.order("id", { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return this.enrichPostsSocial(data || [], viewerId);
  }

  async findByUser(userId: number, viewerId?: number) {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*, users (username, foto_perfil)")
      .eq("user_id", userId)
      .eq("is_visible", true)
      .order("id", { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return this.enrichPostsSocial(data || [], viewerId);
  }

  async addFavorite(postId: number, userId: number) {
    const { error } = await this.supabase
      .from("post_favorites")
      .upsert([{ post_id: postId, user_id: userId }], { onConflict: "user_id,post_id" });

    if (error) throw new InternalServerErrorException(error.message);
    return this.getPostSocial(postId, userId);
  }

  async removeFavorite(postId: number, userId: number) {
    const { error } = await this.supabase
      .from("post_favorites")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) throw new InternalServerErrorException(error.message);
    return this.getPostSocial(postId, userId);
  }

  async getFavoritePosts(userId: number) {
    const { data, error } = await this.supabase
      .from("post_favorites")
      .select("posts (*, users (username, foto_perfil))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    const posts = (data || []).flatMap((item) => { const post = relationOne(item.posts); return post ? [post] : []; });
    return this.enrichPostsSocial(posts, userId);
  }

  async getPostSocial(postId: number, userId?: number) {
    const { data, error } = await this.supabase
      .from("post_favorites")
      .select("user_id")
      .eq("post_id", postId);

    if (error) throw new InternalServerErrorException(error.message);

    return {
      post_id: postId,
      favorite_count: data?.length || 0,
      is_favorited: userId ? (data || []).some((favorite) => Number(favorite.user_id) === Number(userId)) : false,
    };
  }

  async getUserRequests(userId: number) {
  const { data, error } = await this.supabase
    .from("participations")
    .select(`
      id,
      post_id,
      status,
      user_id,
      posts (
        id,
        user_id,
        title,
        image_url,
        event_date,
        category,
        users (username)
      )
    `)
    .eq("user_id", userId);

  if (error) throw new InternalServerErrorException(error.message);

  console.log(`Usuario ${userId} tiene ${data?.length} participaciones totales.`);

  const filtered = data?.map((req) => ({ ...req, posts: relationOne(req.posts) })).filter((req) => {
    if (!req.posts) return false; 
    
    return Number(req.user_id) !== Number(req.posts.user_id);
  });

  console.log(`Tras filtrar (excluyendo posts propios), quedan: ${filtered?.length}`);

  return filtered || [];
}

  async requestJoin(postId: number, userId: number) {
    const { data, error } = await this.supabase.rpc('lynkn_participation', {
      p_action: 'join', p_actor_id: userId, p_post_id: postId,
    });
    if (error) throwDatabaseError(error);
    return data;
  }

  async deleteParticipation(id: number, actor: Principal) {
    const { data, error } = await this.supabase.rpc('lynkn_participation', {
      p_action: 'cancel', p_actor_id: actor.userId, p_participation_id: id,
    });
    if (error) throwDatabaseError(error);
    return data;
  }

  async getParticipants(postId: number, actor: Principal) {
    const { data: post, error: postError } = await this.supabase
      .from("posts")
      .select("user_id, is_visible")
      .eq("id", postId)
      .maybeSingle();

    if (postError) throw new InternalServerErrorException('No se pudo consultar el evento');
    if (!post || (!post.is_visible && Number(post.user_id) !== actor.userId && actor.role !== 'admin')) {
      throw new NotFoundException('Evento no encontrado');
    }
    const ownerId = Number(post.user_id);

    let query = this.supabase
      .from("participations")
      .select("id, status, user_id, users (username, foto_perfil)")
      .eq("post_id", postId)
      .neq("user_id", ownerId);
    if (actor.userId !== ownerId && actor.role !== "admin") query = query.or("status.eq.accepted,user_id.eq." + actor.userId);
    const { data, error } = await query;

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateParticipationStatus(id: number, status: 'accepted' | 'rejected', actor: Principal) {
    const { data, error } = await this.supabase.rpc('lynkn_participation', {
      p_action: 'set', p_actor_id: actor.userId, p_participation_id: id, p_status: status,
    });
    if (error) throwDatabaseError(error);
    return data;
  }

  async deletePost(postId: number, userId: number) {
    const { data, error } = await this.supabase.rpc('lynkn_delete_post', {
      p_post_id: postId, p_actor_id: userId,
    });
    if (error) throwDatabaseError(error);
    return data;
  }

  async handleNotificationAction(notifId: number, status: 'accepted' | 'rejected', actor: Principal) {
    const { data: notification, error } = await this.supabase.from('notifications')
      .select('post_id, sender_id, user_id, type').eq('id', notifId).maybeSingle();
    if (error) throw new InternalServerErrorException('No se pudo consultar la notificacion');
    if (!notification) throw new NotFoundException('Notificacion no encontrada');
    assertOwner(actor, Number(notification.user_id));
    if (notification.type !== 'join_request') throw new BadRequestException('Accion no permitida');
    const { data: participation, error: partError } = await this.supabase.from('participations').select('id')
      .eq('post_id', notification.post_id).eq('user_id', notification.sender_id).maybeSingle();
    if (partError) throw new InternalServerErrorException('No se pudo consultar la solicitud');
    if (!participation) throw new NotFoundException('Solicitud no encontrada');
    return this.updateParticipationStatus(participation.id, status, actor);
  }
}
