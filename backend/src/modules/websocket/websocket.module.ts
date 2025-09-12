import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ManufacturingWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { WebSocketController } from './websocket.controller';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1d'),
        },
      }),
    }),
  ],
  controllers: [WebSocketController],
  providers: [ManufacturingWebSocketGateway, WebSocketService],
  exports: [WebSocketService, ManufacturingWebSocketGateway],
})
export class WebSocketModule {}