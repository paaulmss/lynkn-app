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
} from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileInterceptor } from "@nestjs/platform-express";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  private readonly genAI: GoogleGenerativeAI;
  private readonly safetyModel: any;

  constructor(private readonly postsService: PostsService) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    this.safetyModel = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor("image"))
  async create(@UploadedFile() file: any, @Body() body: any) {
    try {
      if (!file) throw new BadRequestException("La imagen es obligatoria");
      const maxParticipants = body.max_participants
        ? parseInt(body.max_participants, 10)
        : 0;

      const prompt = `Actúa como moderador... Analiza Título: "${body.title}", Descripción: "${body.description}" e Imagen. Respond SOLO "SAFE" or REASON/DETAIL.`;
      const imagePart = {
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype,
        },
      };
      const result = await this.safetyModel.generateContent([
        prompt,
        imagePart,
      ]);
      const response = result.response.text().toUpperCase().trim();

      if (!response.includes("SAFE")) throw new BadRequestException(response);

      return this.postsService.createPost(file, {
        ...body,
        max_participants: maxParticipants,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Fallo en la verificación de seguridad.");
    }
  }

  @Get()
  async getAll() {
    return this.postsService.findAll();
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
