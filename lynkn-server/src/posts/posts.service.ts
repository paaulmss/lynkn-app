import { Express } from "express";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { SupabaseService } from "../supabase.service";

@Injectable()
export class PostsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  public get supabase() {
    return this.supabaseService.getClient();
  }

  private async createNotification(
    userId: number,
    senderId: number,
    postId: number,
    type: string,
  ) {
    const { error } = await this.supabase.from("notifications").insert([
      {
        user_id: userId,
        sender_id: senderId,
        post_id: postId,
        type: type,
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) console.error("Error al crear notificación:", error.message);
  }

  async createPost(file: Express.Multer.File, body: any) {
    let imageUrl: string | null = null;
    if (file) {
      const fileExt = file.originalname.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;
      const { error: uploadError } = await this.supabase.storage
        .from("post_images")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError)
        throw new InternalServerErrorException(
          `Fallo en la carga: ${uploadError.message}`,
        );
      const { data } = this.supabase.storage
        .from("post_images")
        .getPublicUrl(filePath);
      imageUrl = data.publicUrl;
    }

    const { data: post, error: dbError } = await this.supabase
      .from("posts")
      .insert([
        {
          title: body.title,
          description: body.description,
          image_url: imageUrl,
          user_id: parseInt(body.user_id),
          lat: parseFloat(body.lat) || 40.4167,
          lng: parseFloat(body.lng) || -3.7037,
          max_particip: body.max_participants
            ? parseInt(body.max_participants)
            : 0,
          category: body.category || "general",
          event_date: body.event_date || new Date().toISOString(),
          status: "active",
          is_visible: true,
          moderation_status: "approved",
        },
      ])
      .select();

    if (dbError) throw new InternalServerErrorException(dbError.message);
    return post;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*, users (username, foto_perfil)")
      .eq("is_visible", true)
      .order("id", { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return data || [];
  }

  async findByUser(userId: number) {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*, users (username, foto_perfil)")
      .eq("user_id", userId)
      .eq("is_visible", true)
      .order("id", { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return data || [];
  }

  async getUserRequests(userId: number) {
    const { data, error } = await this.supabase
      .from("participations")
      .select(
        `
        id,
        status,
        post_id,
        posts (
          title,
          image_url,
          event_date,
          category
        )
      `,
      )
      .eq("user_id", userId)
      .order("id", { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async requestJoin(postId: number, userId: number) {
    const { data: post, error: postError } = await this.supabase
      .from("posts")
      .select("max_particip, user_id, title")
      .eq("id", postId)
      .single();
    if (postError || !post)
      throw new InternalServerErrorException("No se encontro el post");

    const isUnlimited = post.max_particip === 0;

    const { data: participation, error: partError } = await this.supabase
      .from("participations")
      .insert([
        {
          post_id: postId,
          user_id: userId,
          status: isUnlimited ? "accepted" : "pending",
        },
      ])
      .select("*, users(username)")
      .single();

    if (partError) throw new InternalServerErrorException(partError.message);

    if (isUnlimited) {
      await this.supabase.rpc("increment_participant", { row_id: postId });
      await this.supabase.from("messages").insert([
        {
          post_id: postId,
          sender_id: userId,
          content: `${participation.users.username} se ha unido al grupo`,
          type: "system",
        },
      ]);
      await this.createNotification(post.user_id, userId, postId, "accepted");
    } else {
      await this.createNotification(
        post.user_id,
        userId,
        postId,
        "join_request",
      );
      await this.createNotification(
        userId,
        post.user_id,
        postId,
        "info_pending",
      );
    }
    return participation;
  }

async deleteParticipation(id: number) {
  const { data, error: fetchError } = await this.supabase
    .from('participations')
    .select(`
      post_id, 
      status, 
      user_id, 
      users(username), 
      posts(user_id, title)
    `)
    .eq('id', id)
    .single();

  if (fetchError || !data) throw new InternalServerErrorException('No se encontró la participación');

  const part = data as any; 
  const username = part.users?.username;
  const ownerId = part.posts?.user_id;
  const postTitle = part.posts?.title;

  if (part.status === 'accepted') {
    await this.supabase.rpc('decrement_participant', { row_id: part.post_id });

    await this.supabase
      .from('messages')
      .insert([{
        post_id: part.post_id,
        sender_id: part.user_id,
        content: `${username} ha salido del grupo`,
        type: 'system' 
      }]);

    if (ownerId) {
      await this.createNotification(
        ownerId, 
        part.user_id, 
        part.post_id, 
        'member_left'
      );
    }
  }

  await this.createNotification(
    part.user_id,
    ownerId || 0,
    part.post_id,
    'leave_confirm'
  );

  const { error: deleteError } = await this.supabase
    .from('participations')
    .delete()
    .eq('id', id);

  if (deleteError) throw new InternalServerErrorException(deleteError.message);
  
  return { success: true };
}

  async getParticipants(postId: number) {
    const { data, error } = await this.supabase
      .from("participations")
      .select("id, status, user_id, users (username, foto_perfil)")
      .eq("post_id", postId);
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateParticipationStatus(
    participationId: number,
    status: "accepted" | "rejected",
  ) {
    const { data: part, error } = await this.supabase
      .from("participations")
      .update({ status })
      .eq("id", participationId)
      .select("*, posts(user_id, title)")
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    if (part) {
      await this.supabase
        .from("notifications")
        .delete()
        .eq("user_id", part.posts.user_id)
        .eq("post_id", part.post_id)
        .eq("sender_id", part.user_id)
        .eq("type", "join_request");

      await this.createNotification(
        part.user_id,
        part.posts.user_id,
        part.post_id,
        status,
      );

      if (status === "accepted") {
        await this.supabase.rpc("increment_participant", {
          row_id: part.post_id,
        });
      }
    }
    return part;
  }
}
