import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: "https://lynkn-app.vercel.app", 
    credentials: true
  },
  transports: ['polling', 'websocket'],
})
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Usuario conectado:', client.id);
  }

  @SubscribeMessage('join-session')
  handleJoinSession(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
    client.join(sessionId);
    console.log(`Dispositivo unido a la sesión: ${sessionId}`);
  }

  @SubscribeMessage('send-selfie')
  handleSendSelfie(
    @MessageBody() data: { sessionId: string; imageBase64: string },
  ) {
    // Verificamos que llegue el ID de sesión
    console.log(`Recibida foto para sesión: ${data.sessionId}`);

    // Enviamos a la sala
    this.server.to(data.sessionId).emit('receive-selfie', data.imageBase64);

    return { status: 'ok' };
  }
}