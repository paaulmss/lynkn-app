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
  InternalServerErrorException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { Express } from 'express';

/**
 * Controlador para la gestión de publicaciones y eventos
 */
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: Express.Multer.File, 
    @Body() body: any
  ) {
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
   * Obtiene las publicaciones asociadas a un identificador de usuario específico.
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
   * Gestiona la aceptación o rechazo de una solicitud directamente desde una notificación.
   */
  @Patch('participation-by-notif/:notifId')
  async handleActionFromNotif(
    @Param('notifId', ParseIntPipe) notifId: number,
    @Body('status') status: 'accepted' | 'rejected'
  ) {
    // 1. Accedemos al cliente de supabase a través del servicio
    const supabase = (this.postsService as any).supabase;

    // 2. Buscamos la notificación para identificar el post y al usuario solicitante (sender_id)
    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .select('post_id, sender_id')
      .eq('id', notifId)
      .single();

    if (notifError || !notif) {
      throw new InternalServerErrorException('No se ha podido localizar la notificación vinculada.');
    }

    // 3. Buscamos el ID de la fila en 'participations' correspondiente
    const { data: participation, error: partError } = await supabase
      .from('participations')
      .select('id')
      .eq('post_id', notif.post_id)
      .eq('user_id', notif.sender_id)
      .single();

    if (partError || !participation) {
      throw new InternalServerErrorException('No existe una solicitud de participación válida para esta notificación.');
    }

    // 4. Ejecutamos la lógica de actualización (cambio de estado, contador de plazas y avisos)
    return await this.postsService.updateParticipationStatus(participation.id, status);
  }
}