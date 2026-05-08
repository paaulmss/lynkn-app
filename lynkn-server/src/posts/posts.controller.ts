import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  InternalServerErrorException,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileInterceptor } from "@nestjs/platform-express";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  private readonly genAI: GoogleGenerativeAI;
  private readonly safetyModel: any;

   constructor(private readonly postsService: PostsService) {
  this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  
  this.safetyModel = this.genAI.getGenerativeModel(
    { model: "gemini-2.5-flash" }
  );
}

  @Post()
@UseInterceptors(FileInterceptor('image'))
async create(@UploadedFile() file: any, @Body() body: any) {
  if (!file) throw new BadRequestException('La imagen es obligatoria');
  
  try {
    const imageData = {
      inlineData: {
        data: file.buffer.toString("base64"),
        mimeType: file.mimetype,
      },
    };

    const prompt = `Analiza este título: "${body.title}" y esta descripción: "${body.description}". 
                    También analiza la imagen adjunta. 
                    Si el contenido es violento, sexual, promueve el odio o es ilegal, 
                    responde ÚNICAMENTE con la palabra "RECHAZADO". 
                    Si es seguro, responde "APROBADO".`;

    const result = await this.safetyModel.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text().trim();

    if (text.includes("RECHAZADO")) {
      throw new BadRequestException("Contenido inapropiado detectado por la IA.");
    }

    return await this.postsService.createPost(file, body);
    
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    console.error("Error en creación:", error);
    throw new InternalServerErrorException("Fallo al procesar la publicación");
  }
}

  @Get()
async getAll(@Query("exclude") excludeUserId?: string) {
  const userId = excludeUserId ? parseInt(excludeUserId) : undefined;
  return this.postsService.findAll(userId);
}

  @Get("user/:userId")
  async findByUser(@Param("userId", ParseIntPipe) userId: number) {
    return this.postsService.findByUser(userId);
  }

  @Get("user-requests/:userId")
  async getUserRequests(@Param("userId", ParseIntPipe) userId: number) {
    return this.postsService.getUserRequests(userId);
  }

  @Post(":id/join")
  async joinPost(
    @Param("id", ParseIntPipe) id: number,
    @Body("userId") userId: number,
  ) {
    return await this.postsService.requestJoin(id, userId);
  }

  @Patch("participation/:id")
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body("status") status: "accepted" | "rejected",
  ) {
    return await this.postsService.updateParticipationStatus(id, status);
  }

  @Delete("participation/:id")
  async cancelParticipation(@Param("id", ParseIntPipe) id: number) {
    return await this.postsService.deleteParticipation(id);
  }

  @Delete(":id")
async removePost(
  @Param("id", ParseIntPipe) id: number,
  @Query("userId", ParseIntPipe) userId: number
) {
  return await this.postsService.deletePost(id, userId);
}

  @Get(":id/participants")
  async getParticipants(@Param("id", ParseIntPipe) id: number) {
    return this.postsService.getParticipants(id);
  }

  

  @Patch("participation-by-notif/:notifId")
  async handleActionFromNotif(
    @Param("notifId", ParseIntPipe) notifId: number,
    @Body("status") status: "accepted" | "rejected",
  ) {
    const supabase = (this.postsService as any).supabase;
    const { data: notif } = await supabase
      .from("notifications")
      .select("post_id, sender_id")
      .eq("id", notifId)
      .single();
    if (!notif)
      throw new InternalServerErrorException("Notificación no encontrada");

    const { data: participation } = await supabase
      .from("participations")
      .select("id")
      .eq("post_id", notif.post_id)
      .eq("user_id", notif.sender_id)
      .single();
    if (!participation)
      throw new InternalServerErrorException("Solicitud no encontrada");

    return await this.postsService.updateParticipationStatus(
      participation.id,
      status,
    );
  }
}
