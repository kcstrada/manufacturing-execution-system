import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth/auth.module';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationService } from './services/notification.service';
import { EmailService } from './services/email.service';
import { InAppNotificationService } from './services/in-app-notification.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationPreferenceService } from './services/notification-preference.service';
import { NotificationEventListener } from './listeners/notification-event.listener';
import { NotificationController } from './controllers/notification.controller';
import { NotificationPreferenceController } from './controllers/notification-preference.controller';
import { NotificationTemplateController } from './controllers/notification-template.controller';

@Global()
@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      NotificationTemplate,
    ]),
  ],
  providers: [
    NotificationService,
    EmailService,
    InAppNotificationService,
    NotificationTemplateService,
    NotificationPreferenceService,
    NotificationEventListener,
  ],
  controllers: [
    NotificationController,
    NotificationPreferenceController,
    NotificationTemplateController,
  ],
  exports: [
    NotificationService,
    EmailService,
    InAppNotificationService,
    NotificationTemplateService,
    NotificationPreferenceService,
  ],
})
export class NotificationsModule {}