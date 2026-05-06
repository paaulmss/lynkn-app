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
import { Express } from 'express';

/**
 * Controlador para la gestion de publicaciones y eventos
 */
@Controller('posts')
export class PostsController {
  private readonly genAI: GoogleGenerativeAI;
  private readonly safetyModel: any;

  constructor(private readonly postsService: PostsService) {
    // Inicializamos Gemini con API KEY
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // Usamos el modelo flash por su rapidez y bajo consumo
    this.safetyModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: any, 
    @Body() body: any
  ) {
    // 1. Validamos el texto con Gemini antes de hacer nada
    const validation = await this.validateContent({ 
      text: `${body.title} ${body.description}` 
    });
    
    // 2. Si la IA dice que no es seguro, lanzamos la excepcion
    if (!validation.safe) {
      throw new BadRequestException('Contenido inapropiado detectado por la IA.');
    }

    // 3. Solo si es seguro, procedemos a crear el post
    return this.postsService.createPost(file, body);
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
      const prompt = `Analiza el siguiente texto de una red social y determina si infringe normas de comunidad (odio, acoso, violencia o contenido sexual explícito). 
      Responde UNICAMENTE con la palabra "SAFE" si es permitido o "UNSAFE" si debe ser bloqueado. 
      Texto a analizar: "${data.text}"`;

      const result = await this.safetyModel.generateContent(prompt);
      const responseText = result.response.text().toUpperCase();

      if (responseText.includes("UNSAFE")) {
        return { 
          safe: false, 
          reasons: ["Contenido inapropiado detectado por filtros de seguridad"] 
        };
      }

      return { safe: true };
    } catch (error) {
      console.error('Error con Gemini:', error);
      return { safe: true }; 
    }
  }
}