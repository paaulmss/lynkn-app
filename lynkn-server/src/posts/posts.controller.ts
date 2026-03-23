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
  HttpCode
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
}