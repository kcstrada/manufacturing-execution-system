import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../../auth/auth.module';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import { Worker, WorkerSchedule } from '../../entities/worker.entity';
import { Task } from '../../entities/task.entity';
import { TaskAssignment } from '../../entities/task-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Worker, WorkerSchedule, Task, TaskAssignment]),
    EventEmitterModule.forRoot(),
    AuthModule,
  ],
  controllers: [WorkerController],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
