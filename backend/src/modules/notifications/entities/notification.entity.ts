import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationChannel, NotificationPriority, NotificationStatus } from '../types/notification.types';

@Entity('notifications')
@Index(['userId', 'tenantId', 'status'])
@Index(['type', 'createdAt'])
@Index(['tenantId', 'createdAt'])
export class Notification {
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

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  @ApiProperty({ enum: NotificationPriority })
  priority!: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  @Index()
  @ApiProperty({ enum: NotificationStatus })
  status!: NotificationStatus;

  @Column()
  @ApiProperty()
  title!: string;

  @Column('text')
  @ApiProperty()
  message!: string;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ required: false })
  data?: any;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ required: false })
  metadata?: {
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    iconUrl?: string;
    category?: string;
    tags?: string[];
  };

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  templateId?: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  groupId?: string;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ required: false })
  scheduledFor?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ required: false })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ required: false })
  readAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ required: false })
  acknowledgedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ required: false })
  expiresAt?: Date;

  @Column({ default: 0 })
  @ApiProperty()
  retryCount!: number;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  lastError?: string;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ required: false })
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
    data?: any;
  }>;

  @CreateDateColumn()
  @ApiProperty()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt!: Date;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  createdBy?: string;
}