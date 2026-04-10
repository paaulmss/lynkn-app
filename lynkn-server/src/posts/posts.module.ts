import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { SupabaseService } from '../supabase.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, SupabaseService]
})
export class PostsModule {}
