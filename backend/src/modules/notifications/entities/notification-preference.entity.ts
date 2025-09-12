import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationChannel } from '../types/notification.types';

@Entity('notification_preferences')
@Unique(['userId', 'tenantId', 'type', 'channel'])
@Index(['userId', 'tenantId'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id!: string;

  @Column()
  @Index()
  @ApiProperty()
  tenantId!: string;

  @Column()
  @Index()
  @ApiProperty()
  userId!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ default: true })
  @ApiProperty()
  enabled!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ required: false })
  settings?: {
    email?: string;
    phoneNumber?: string;
    webhookUrl?: string;
    quietHours?: {
      enabled: boolean;
      startTime: string; // "22:00"
      endTime: string;   // "08:00"
      timezone: string;  // "America/New_York"
    };
    frequency?: {
      immediate: boolean;
      digest: boolean;
      digestInterval?: 'hourly' | 'daily' | 'weekly';
    };
    filters?: {
      priority?: string[];
      categories?: string[];
      tags?: string[];
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ required: false })
  unsubscribeTokens?: {
    email?: string;
    sms?: string;
  };

  @CreateDateColumn()
  @ApiProperty()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt!: Date;
}