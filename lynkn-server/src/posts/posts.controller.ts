import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Patch,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';

/**
 * Controlador para la gestion de publicaciones y eventos
 */
@Controller('posts')
export class PostsController {
  private readonly genAI: GoogleGenerativeAI;
  private readonly safetyModel: any;

 constructor(private readonly postsService: PostsService) {
  this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  
  this.safetyModel = this.genAI.getGenerativeModel(
    { model: "gemini-2.5-flash" },
    { apiVersion: 'v1' } 
  );
}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(@UploadedFile() file: any, @Body() body: any) {
    try {
      if (!file) throw new BadRequestException('La imagen es obligatoria');

      const prompt = `Actúa como moderador de contenido.
      Analiza Título: "${body.title}", Descripción: "${body.description}" e Imagen.

      REGLAS DE RESPUESTA:
      1. Si es seguro, responde SOLO: "SAFE"
      2. Si es inseguro, responde con este formato: 
      REASON: [Escribe aquí si falla el Título, la Descripción, la Imagen o Todo] | DETAIL: [Breve explicación en español]`;

      const imagePart = {
        inlineData: { data: file.buffer.toString("base64"), mimeType: file.mimetype }
      };

      const result = await this.safetyModel.generateContent([prompt, imagePart]);
      const response = result.response.text().toUpperCase().trim();

      console.log("--- RESPUESTA DE GEMINI ---");
      console.log(`"${response}"`); 
      console.log("---------------------------");

      if (response !== "SAFE") {
        throw new BadRequestException('Contenido inapropiado detectado por la IA.');
      }

      return this.postsService.createPost(file, body);

    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      console.error("Fallo crítico seguridad:", (error as any).message);

      throw new BadRequestException('No se pudo verificar la seguridad. Inténtalo de nuevo.');
    }
  }

  /**
   * Recupera el listado global de todas las publicaciones activas.
   */
  @Get()
  async getAll() {
    return this.postsService.findAll();
  }

  /**
   * Obtiene las publicaciones asociadas a un identificador de usuario especifico.
   */
  @Get('user/:userId')
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.postsService.findByUser(userId);
  }

  @Post(':id/join')
  async joinPost(@Param('id') id: string, @Body('userId') userId: number) {
    return await this.postsService.requestJoin(parseInt(id), userId);
  }

  @Patch('participation/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'accepted' | 'rejected'
  ) {
    return await this.postsService.updateParticipationStatus(parseInt(id), status);
  }

  @Get(':id/participants')
  async getParticipants(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getParticipants(id);
  }

  /**
   * Gestiona la aceptacion o rechazo de una solicitud directamente desde una notificacion.
   */
  @Patch('participation-by-notif/:notifId')
  async handleActionFromNotif(
    @Param('notifId', ParseIntPipe) notifId: number,
    @Body('status') status: 'accepted' | 'rejected'
  ) {
    const supabase = (this.postsService as any).supabase;

    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .select('post_id, sender_id')
      .eq('id', notifId)
      .single();

    if (notifError || !notif) {
      throw new InternalServerErrorException('No se ha podido localizar la notificación vinculada.');
    }

    const { data: participation, error: partError } = await supabase
      .from('participations')
      .select('id')
      .eq('post_id', notif.post_id)
      .eq('user_id', notif.sender_id)
      .single();

    if (partError || !participation) {
      throw new InternalServerErrorException('No existe una solicitud de participación válida para esta notificación.');
    }

    return await this.postsService.updateParticipationStatus(participation.id, status);
  }

  @Post('validate-content')
  async validateContent(@Body() data: { text: string }) {
    try {
      const prompt = `Moderate this text: "${data.text}". Respond ONLY "SAFE" or "UNSAFE".`;
      const result = await this.safetyModel.generateContent(prompt);
      const response = result.response.text().toUpperCase().trim();

      if (response !== "SAFE") {
        return { safe: false, reasons: ["Lenguaje inapropiado o peligroso detectado."] };
      }
      return { safe: true };
    } catch (error) {
      return { safe: false, reasons: ["Error en el sistema de verificación."] };
    }
  }
}