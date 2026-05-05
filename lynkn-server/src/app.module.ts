// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SocketGateway } from './socket/socket.gateway';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupabaseService } from './supabase.service'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    AdminModule,
    PostsModule,
    NotificationsModule,
  ],
  providers: [SocketGateway, SupabaseService],
})
export class AppModule { }