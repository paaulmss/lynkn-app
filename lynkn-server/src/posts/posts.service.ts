import { Express } from "express";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { SupabaseService } from "../supabase.service";

@Injectable()
export class PostsService {
  constructor(private readonly supabaseService: SupabaseService) { }

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

    const { data: postArray, error: dbError } = await this.supabase
      .from("posts")
      .insert([
        {
          title: body.title,
          description: body.description,
          image_url: imageUrl,
          user_id: parseInt(body.user_id),
          lat: parseFloat(body.lat) || 40.4167,
          lng: parseFloat(body.lng) || -3.7037,
          max_particip: body.max_participants ? parseInt(body.max_participants) : 0,
          current_particip: 0,
          category: body.category || "general",
          event_date: body.event_date || new Date().toISOString(),
          status: "active",
          is_visible: true,
          moderation_status: "approved",
        },
      ])
      .select()
      .single();

    if (dbError) throw new InternalServerErrorException(dbError.message);

    if (postArray) {
      const { error: partError } = await this.supabase
        .from("participations")
        .insert([
          {
            post_id: postArray.id,
            user_id: postArray.user_id,
            status: "accepted",
          },
        ]);

      if (partError) {
        console.error("Error al auto-unir al creador:", partError.message);
      }
    }

    return postArray;
  }

  async findAll(excludeUserId?: number) {
    let query = this.supabase
      .from("posts")
      .select("*, users (username, foto_perfil)")
      .eq("is_visible", true);

    if (excludeUserId) {
      query = query.neq("user_id", excludeUserId);
    }

    const { data, error } = await query.order("id", { ascending: false });

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
    .select(`
      id,
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

  const filtered = data?.filter((req: any) => {
    if (!req.posts) return false; 
    
    return Number(req.user_id) !== Number(req.posts.user_id);
  });

  console.log(`Tras filtrar (excluyendo posts propios), quedan: ${filtered?.length}`);

  return filtered || [];
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
    const { data: post } = await this.supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    const ownerId = Number(post?.user_id);

    const { data, error } = await this.supabase
      .from("participations")
      .select("id, status, user_id, users (username, foto_perfil)")
      .eq("post_id", postId)
      .neq("user_id", ownerId); // Usamos la variable casteada

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateParticipationStatus(participationId: number, status: "accepted" | "rejected") {
    try {
      // Obtener el estado actual y datos del usuario
      const { data: currentPart, error: currentError } = await this.supabase
        .from("participations")
        .select("status, post_id, user_id, users(username), posts(user_id)")
        .eq("id", participationId)
        .single();

      if (currentError || !currentPart) throw new InternalServerErrorException("No se encontró la participación");

      const ownerId = (currentPart.posts as any)?.user_id;
      if (status === "rejected" && currentPart.user_id === ownerId) {
        throw new BadRequestException("El organizador no puede ser expulsado de su propio evento");
      }

      if (status === "accepted") {
        const { data: postInfo } = await this.supabase
          .from("posts")
          .select("max_particip, current_particip")
          .eq("id", currentPart.post_id)
          .single();

        const isUnlimited = postInfo.max_particip === 0;
        if (!isUnlimited && postInfo.current_particip >= postInfo.max_particip) {
          throw new BadRequestException("El evento ya ha alcanzado el límite de participantes");
        }
      }

      const { data: updatedPart, error: updateError } = await this.supabase
        .from("participations")
        .update({ status })
        .eq("id", participationId)
        .select("*, posts(user_id, title)")
        .single();

      if (updateError) throw new InternalServerErrorException(updateError.message);

      const userArray = currentPart.users as unknown as { username: string }[];
      const participantUsername = Array.isArray(userArray) ? userArray[0]?.username : (userArray as any)?.username;

      if (updatedPart) {
        // CASO A: ACEPTAR A ALGUIEN NUEVO
        if (status === "accepted") {
          await this.supabase.rpc("increment_participant", { row_id: updatedPart.post_id });

          await this.supabase.from("messages").insert([{
            post_id: updatedPart.post_id,
            sender_id: updatedPart.posts.user_id,
            content: `${participantUsername} se ha unido al grupo`,
            type: "system"
          }]);
        }

        // CASO B: EXPULSAR / RECHAZAR A ALGUIEN QUE YA ESTABA DENTRO
        if (currentPart.status === "accepted" && status === "rejected") {
          // RECALCULO: Liberar plaza en la DB para que otro pueda entrar
          await this.supabase.rpc("decrement_participant", { row_id: updatedPart.post_id });

          // Chat: Mensaje de sistema informativo para los que siguen dentro
          await this.supabase.from("messages").insert([{
            post_id: updatedPart.post_id,
            sender_id: updatedPart.posts.user_id,
            content: `${participantUsername} ha sido eliminado del evento por el organizador`,
            type: "system"
          }]);

          // NOTIFICACIÓN: Aviso de expulsión al usuario
          await this.createNotification(
            updatedPart.user_id,
            updatedPart.posts.user_id,
            updatedPart.post_id,
            'kicked'
          );
        }

        // Limpiar notificaciones de solicitud antiguas
        await this.supabase
          .from("notifications")
          .delete()
          .eq("user_id", updatedPart.posts.user_id)
          .eq("post_id", updatedPart.post_id)
          .eq("sender_id", updatedPart.user_id)
          .eq("type", "join_request");
      }

      return updatedPart;
    } catch (error) {
      console.error("Error en updateParticipationStatus:", error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException("No se pudo procesar el cambio de estado");
    }
  }

  async deletePost(postId: number, userId: number) {
    const { data: participants, error: fetchError } = await this.supabase
      .from('participations')
      .select('user_id')
      .eq('post_id', postId)
      .neq('user_id', userId);

    if (fetchError) throw new InternalServerErrorException("Error al obtener participantes");

    // 2. Si hay gente, les enviamos la notificación de "Evento Cancelado"
    if (participants && participants.length > 0) {
      //Obtenemos el título antes de que muera el post
      const { data: postData } = await this.supabase
        .from('posts')
        .select('title')
        .eq('id', postId)
        .single();

      const notifications = participants.map(p => ({
        user_id: p.user_id,
        sender_id: userId,
        post_id: null,
        type: 'post_deleted',
        is_read: false,
        created_at: new Date().toISOString()
      }));

      await this.supabase.from('notifications').insert(notifications);
    }

    // 3. Borramos el post físicamente
    const { error: deleteError } = await this.supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId); // Seguridad: solo el dueño puede borrarlo

    if (deleteError) throw new InternalServerErrorException(deleteError.message);

    return { success: true };
  }

  async kickParticipant(participationId: number, ownerId: number) {
    // 1. Obtener datos del participante antes de nada
    const { data: part, error: fetchError } = await this.supabase
      .from('participations')
      .select('*, users(username), posts(title)')
      .eq('id', participationId)
      .single();

    if (fetchError || !part) throw new Error("No se encontró la participación");

    // 2. Cambiar estado a 'rejected'
    const { error: updateError } = await this.supabase
      .from('participations')
      .update({ status: 'rejected' })
      .eq('id', participationId);

    if (updateError) throw new Error("Error al expulsar");

    // 3. Si estaba aceptado, liberamos el hueco en el post
    if (part.status === 'accepted') {
      await this.supabase.rpc('decrement_participant', { row_id: part.post_id });

      // 4. Mensaje de sistema en el CHAT para todos
      await this.supabase.from('messages').insert([{
        post_id: part.post_id,
        sender_id: ownerId,
        content: `${part.users.username} ha sido expulsado del evento por el organizador.`,
        type: 'system'
      }]);
    }

    // 5. Notificación privada al usuario expulsado
    await this.createNotification(
      part.user_id,
      ownerId,
      part.post_id,
      'kicked' // Crearemos este tipo en el frontend
    );

    return { success: true };
  }
}
