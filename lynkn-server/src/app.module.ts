// app.module.ts
import { Module } from '@nestjs/common';
import { join } from 'node:path';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SocketGateway } from './socket/socket.gateway';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupabaseModule } from './supabase.service';

import { ChatService } from './socket/chat.service';
import { ChatController } from './socket/chat.controller';

import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, "..", ".env"),
      validate: (env: Record<string, unknown>) => {
        for (const key of ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_KEY']) {
          if (typeof env[key] !== 'string' || !env[key]) throw new Error('Missing configuration: ' + key);
        }
        if (String(env.JWT_SECRET).length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
        new URL(String(env.SUPABASE_URL));
        const port = Number(env.PORT ?? (env.NODE_ENV === 'production' ? 10000 : 4000));
        if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
        return { ...env, PORT: port };
      },
    }),
    SupabaseModule,
    UsersModule,
    AuthModule,
    AdminModule,
    PostsModule,
    NotificationsModule,
  ],
  controllers: [ChatController, HealthController],
  providers: [SocketGateway, ChatService],
})
export class AppModule { }