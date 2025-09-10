import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from '../../auth/auth.module';
import { TaskController } from './task.controller';
import { TaskService } from './services/task.service';
import { TaskAssignmentService } from './services/task-assignment.service';
import { Task, TaskTimeLog } from '../../entities/task.entity';
import { TaskAssignment } from '../../entities/task-assignment.entity';
import { User } from '../../entities/user.entity';
import { WorkCenter } from '../../entities/work-center.entity';
import { WorkOrder } from '../../entities/work-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskTimeLog,
      TaskAssignment,
      User,
      WorkCenter,
      WorkOrder,
    ]),
    EventEmitterModule.forRoot(),
    ClsModule,
    AuthModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskAssignmentService],
  exports: [TaskService, TaskAssignmentService],
})
export class TaskModule {}