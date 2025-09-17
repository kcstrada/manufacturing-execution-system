import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from '../../auth/auth.module';
import { TaskController } from './task.controller';
import {
  TaskDependencyController,
  WorkOrderDependencyController,
} from './controllers/task-dependency.controller';
import { TaskSplitReassignController } from './controllers/task-split-reassign.controller';
import { TaskService } from './services/task.service';
import { TaskAssignmentService } from './services/task-assignment.service';
import { TaskDependencyService } from './services/task-dependency.service';
import { TaskSplitReassignService } from './services/task-split-reassign.service';
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
  controllers: [
    TaskController,
    TaskDependencyController,
    WorkOrderDependencyController,
    TaskSplitReassignController,
  ],
  providers: [
    TaskService,
    TaskAssignmentService,
    TaskDependencyService,
    TaskSplitReassignService,
  ],
  exports: [
    TaskService,
    TaskAssignmentService,
    TaskDependencyService,
    TaskSplitReassignService,
  ],
})
export class TaskModule {}
