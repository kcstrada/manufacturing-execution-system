import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketEvent,
  WebSocketMessage,
  WebSocketClient,
  RoomType,
  NotificationPayload,
  BroadcastOptions,
  WebSocketResponse,
} from './interfaces/websocket.interface';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
  transports: ['websocket', 'polling'],
})
@Injectable()
export class ManufacturingWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(ManufacturingWebSocketGateway.name);
  private readonly clients = new Map<string, WebSocketClient>();
  private readonly rooms = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    
    // Configure socket middleware for authentication
    server.use(async (socket: Socket, next) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          return next(new WsException('Unauthorized: No token provided'));
        }

        const payload = await this.validateToken(token);
        socket.data.user = payload;
        socket.data.tenantId = payload.tenantId;
        socket.data.userId = payload.sub;
        socket.data.roles = payload.roles || [];
        
        next();
      } catch (error) {
        this.logger.error(`Authentication failed: ${(error as Error).message}`);
        next(new WsException('Unauthorized: Invalid token'));
      }
    });
  }

  async handleConnection(client: Socket) {
    try {
      const { userId, tenantId, roles } = client.data;
      
      this.logger.log(`Client connected: ${client.id} (User: ${userId}, Tenant: ${tenantId})`);

      // Create client record
      const webSocketClient: WebSocketClient = {
        id: client.id,
        userId,
        tenantId,
        roles,
        connectedAt: new Date(),
        rooms: new Set(),
      };

      this.clients.set(client.id, webSocketClient);

      // Join tenant room
      const tenantRoom = `${RoomType.TENANT}:${tenantId}`;
      await this.joinRoom(client, tenantRoom);

      // Join user-specific room
      const userRoom = `${RoomType.USER}:${userId}`;
      await this.joinRoom(client, userRoom);

      // Join role-based rooms
      for (const role of roles) {
        const roleRoom = `${RoomType.ROLE}:${tenantId}:${role}`;
        await this.joinRoom(client, roleRoom);
      }

      // Send connection confirmation
      client.emit(WebSocketEvent.CONNECTION, {
        success: true,
        clientId: client.id,
        timestamp: new Date(),
      });

      // Notify about new connection
      this.broadcastToTenant(tenantId, WebSocketEvent.SYSTEM_NOTIFICATION, {
        type: 'user_connected',
        userId,
        timestamp: new Date(),
      }, [client.id]);

    } catch (error) {
      this.logger.error(`Connection handling failed: ${(error as Error).message}`, (error as Error).stack);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const webSocketClient = this.clients.get(client.id);
      
      if (webSocketClient) {
        this.logger.log(`Client disconnected: ${client.id} (User: ${webSocketClient.userId})`);
        
        // Leave all rooms
        for (const room of webSocketClient.rooms) {
          await this.leaveRoom(client, room);
        }

        // Remove client record
        this.clients.delete(client.id);

        // Notify about disconnection
        this.broadcastToTenant(
          webSocketClient.tenantId,
          WebSocketEvent.SYSTEM_NOTIFICATION,
          {
            type: 'user_disconnected',
            userId: webSocketClient.userId,
            timestamp: new Date(),
          },
          [client.id]
        );
      }
    } catch (error) {
      this.logger.error(`Disconnection handling failed: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  // Subscribe to specific events
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { events: WebSocketEvent[] },
    @ConnectedSocket() client: Socket,
  ): Promise<WebSocketResponse> {
    try {
      const webSocketClient = this.clients.get(client.id);
      
      if (!webSocketClient) {
        throw new WsException('Client not found');
      }

      // Join event-specific rooms
      for (const event of data.events) {
        const eventRoom = `event:${webSocketClient.tenantId}:${event}`;
        await this.joinRoom(client, eventRoom);
      }

      return {
        success: true,
        data: { subscribedEvents: data.events },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Subscribe failed: ${(error as Error).message}`);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  // Unsubscribe from events
  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @MessageBody() data: { events: WebSocketEvent[] },
    @ConnectedSocket() client: Socket,
  ): Promise<WebSocketResponse> {
    try {
      const webSocketClient = this.clients.get(client.id);
      
      if (!webSocketClient) {
        throw new WsException('Client not found');
      }

      // Leave event-specific rooms
      for (const event of data.events) {
        const eventRoom = `event:${webSocketClient.tenantId}:${event}`;
        await this.leaveRoom(client, eventRoom);
      }

      return {
        success: true,
        data: { unsubscribedEvents: data.events },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Unsubscribe failed: ${(error as Error).message}`);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  // Join a specific room (department, work center, etc.)
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { room: string; type: RoomType },
    @ConnectedSocket() client: Socket,
  ): Promise<WebSocketResponse> {
    try {
      const webSocketClient = this.clients.get(client.id);
      
      if (!webSocketClient) {
        throw new WsException('Client not found');
      }

      const roomName = `${data.type}:${webSocketClient.tenantId}:${data.room}`;
      await this.joinRoom(client, roomName);

      return {
        success: true,
        data: { room: roomName },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Join room failed: ${(error as Error).message}`);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  // Leave a room
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { room: string; type: RoomType },
    @ConnectedSocket() client: Socket,
  ): Promise<WebSocketResponse> {
    try {
      const webSocketClient = this.clients.get(client.id);
      
      if (!webSocketClient) {
        throw new WsException('Client not found');
      }

      const roomName = `${data.type}:${webSocketClient.tenantId}:${data.room}`;
      await this.leaveRoom(client, roomName);

      return {
        success: true,
        data: { room: roomName },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Leave room failed: ${(error as Error).message}`);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  // Public methods for broadcasting events from services

  public broadcastToTenant(
    tenantId: string,
    event: WebSocketEvent,
    data: any,
    excludeClients: string[] = [],
  ) {
    const room = `${RoomType.TENANT}:${tenantId}`;
    this.broadcastToRoom(room, event, data, tenantId, excludeClients);
  }

  public broadcastToUser(
    userId: string,
    event: WebSocketEvent,
    data: any,
    tenantId: string,
  ) {
    const room = `${RoomType.USER}:${userId}`;
    this.broadcastToRoom(room, event, data, tenantId);
  }

  public broadcastToRole(
    role: string,
    tenantId: string,
    event: WebSocketEvent,
    data: any,
    excludeClients: string[] = [],
  ) {
    const room = `${RoomType.ROLE}:${tenantId}:${role}`;
    this.broadcastToRoom(room, event, data, tenantId, excludeClients);
  }

  public broadcastToDepartment(
    departmentId: string,
    tenantId: string,
    event: WebSocketEvent,
    data: any,
    excludeClients: string[] = [],
  ) {
    const room = `${RoomType.DEPARTMENT}:${tenantId}:${departmentId}`;
    this.broadcastToRoom(room, event, data, tenantId, excludeClients);
  }

  public broadcastToWorkCenter(
    workCenterId: string,
    tenantId: string,
    event: WebSocketEvent,
    data: any,
    excludeClients: string[] = [],
  ) {
    const room = `${RoomType.WORK_CENTER}:${tenantId}:${workCenterId}`;
    this.broadcastToRoom(room, event, data, tenantId, excludeClients);
  }

  public broadcast(
    event: WebSocketEvent,
    data: any,
    options: BroadcastOptions = {},
  ) {
    const message: WebSocketMessage = {
      event,
      data,
      timestamp: new Date(),
      tenantId: options.tenantId || '',
    };

    if (options.rooms) {
      for (const room of options.rooms) {
        this.server.to(room).emit(event, message);
      }
    } else if (options.userIds) {
      for (const userId of options.userIds) {
        const room = `${RoomType.USER}:${userId}`;
        this.server.to(room).emit(event, message);
      }
    } else if (options.roles && options.tenantId) {
      for (const role of options.roles) {
        const room = `${RoomType.ROLE}:${options.tenantId}:${role}`;
        this.server.to(room).emit(event, message);
      }
    } else if (options.tenantId) {
      this.broadcastToTenant(options.tenantId, event, data, options.excludeUserIds);
    }
  }

  public sendNotification(
    userId: string,
    tenantId: string,
    notification: NotificationPayload,
  ) {
    this.broadcastToUser(
      userId,
      WebSocketEvent.SYSTEM_NOTIFICATION,
      notification,
      tenantId,
    );
  }

  // Private helper methods

  private async joinRoom(client: Socket, room: string) {
    await client.join(room);
    
    const webSocketClient = this.clients.get(client.id);
    if (webSocketClient) {
      webSocketClient.rooms.add(room);
    }

    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)?.add(client.id);

    this.logger.debug(`Client ${client.id} joined room ${room}`);
  }

  private async leaveRoom(client: Socket, room: string) {
    await client.leave(room);
    
    const webSocketClient = this.clients.get(client.id);
    if (webSocketClient) {
      webSocketClient.rooms.delete(room);
    }

    this.rooms.get(room)?.delete(client.id);
    if (this.rooms.get(room)?.size === 0) {
      this.rooms.delete(room);
    }

    this.logger.debug(`Client ${client.id} left room ${room}`);
  }

  private broadcastToRoom(
    room: string,
    event: WebSocketEvent,
    data: any,
    tenantId: string,
    excludeClients: string[] = [],
  ) {
    const message: WebSocketMessage = {
      event,
      data,
      timestamp: new Date(),
      tenantId,
    };

    if (excludeClients.length > 0) {
      this.server.to(room).except(excludeClients).emit(event, message);
    } else {
      this.server.to(room).emit(event, message);
    }
  }

  private extractToken(socket: Socket): string | null {
    const authHeader = socket.handshake.headers.authorization;
    const queryToken = socket.handshake.query.token as string;
    const authToken = socket.handshake.auth?.token;

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return queryToken || authToken || null;
  }

  private async validateToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (error) {
      throw new WsException('Invalid token');
    }
  }

  // Get connected clients info (for monitoring)
  public getConnectedClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }

  public getClientsByTenant(tenantId: string): WebSocketClient[] {
    return Array.from(this.clients.values()).filter(
      client => client.tenantId === tenantId
    );
  }

  public getRoomMembers(room: string): string[] {
    return Array.from(this.rooms.get(room) || []);
  }
}