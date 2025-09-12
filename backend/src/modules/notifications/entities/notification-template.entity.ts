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

@Entity('notification_templates')
@Unique(['tenantId', 'code'])
@Index(['tenantId', 'type', 'channel'])
export class NotificationTemplate {
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
  code!: string; // Unique identifier like 'order.created', 'inventory.low_stock'

  @Column()
  @ApiProperty()
  name!: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  description?: string;

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

  @Column()
  @ApiProperty()
  subject!: string; // Template with variables like "Order {{orderNumber}} has been created"

  @Column('text')
  @ApiProperty()
  body!: string; // HTML or plain text template with variables

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ required: false })
  variables?: {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ required: false })
  metadata?: {
    category?: string;
    tags?: string[];
    locale?: string;
    version?: string;
  };

  @Column({ default: true })
  @ApiProperty()
  active!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ required: false })
  styling?: {
    headerColor?: string;
    headerImage?: string;
    footerText?: string;
    buttonColor?: string;
    fontFamily?: string;
  };

  @CreateDateColumn()
  @ApiProperty()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt!: Date;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  createdBy?: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  updatedBy?: string;
}