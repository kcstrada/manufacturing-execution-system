import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  WebSocketEvent,
  RoomType,
  NotificationType,
  NotificationSeverity,
} from '../interfaces/websocket.interface';

export class SubscribeEventsDto {
  @ApiProperty({
    description: 'List of events to subscribe to',
    enum: WebSocketEvent,
    isArray: true,
  })
  @IsArray()
  @IsEnum(WebSocketEvent, { each: true })
  events!: WebSocketEvent[];
}

export class JoinRoomDto {
  @ApiProperty({
    description: 'Room identifier',
  })
  @IsString()
  room!: string;

  @ApiProperty({
    description: 'Type of room',
    enum: RoomType,
  })
  @IsEnum(RoomType)
  type!: RoomType;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Event type',
    enum: WebSocketEvent,
  })
  @IsEnum(WebSocketEvent)
  event!: WebSocketEvent;

  @ApiProperty({
    description: 'Message data',
  })
  @IsObject()
  data!: any;

  @ApiProperty({
    description: 'Target room',
    required: false,
  })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiProperty({
    description: 'Target users',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];
}

export class NotificationDto {
  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({
    description: 'Notification title',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Notification message',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Notification severity',
    enum: NotificationSeverity,
  })
  @IsEnum(NotificationSeverity)
  severity!: NotificationSeverity;

  @ApiProperty({
    description: 'Additional data',
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiProperty({
    description: 'Notification actions',
    required: false,
  })
  @IsOptional()
  @IsArray()
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

export class BroadcastDto {
  @ApiProperty({
    description: 'Event type',
    enum: WebSocketEvent,
  })
  @IsEnum(WebSocketEvent)
  event!: WebSocketEvent;

  @ApiProperty({
    description: 'Message data',
  })
  @IsObject()
  data!: any;

  @ApiProperty({
    description: 'Target rooms',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rooms?: string[];

  @ApiProperty({
    description: 'Target roles',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiProperty({
    description: 'Target user IDs',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiProperty({
    description: 'Exclude user IDs',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeUserIds?: string[];
}
