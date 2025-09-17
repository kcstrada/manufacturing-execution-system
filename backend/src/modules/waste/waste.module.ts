import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../../auth/auth.module';
import { WasteService } from './waste.service';
import { WasteController } from './waste.controller';
import { WasteRecord } from '../../entities/waste-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WasteRecord]),
    EventEmitterModule,
    AuthModule,
  ],
  controllers: [WasteController],
  providers: [WasteService],
  exports: [WasteService],
})
export class WasteModule {}
