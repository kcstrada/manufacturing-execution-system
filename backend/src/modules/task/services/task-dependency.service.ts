import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { Task, TaskStatus } from '../../../entities/task.entity';

export interface DependencyValidationResult {
  isValid: boolean;
  issues: string[];
  circularDependencies?: string[][];
  incompleteDependencies?: Task[];
  readyTasks?: Task[];
  blockedTasks?: Task[];
}

export interface TaskDependencyGraph {
  nodes: Map<string, Task>;
  edges: Map<string, Set<string>>; // task -> dependencies
  reverseEdges: Map<string, Set<string>>; // task -> dependents
}

@Injectable()
export class TaskDependencyService {
  private readonly logger = new Logger(TaskDependencyService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly eventEmitter: EventEmitter2,
    private readonly clsService: ClsService,
  ) {}

  /**
   * Add a dependency between tasks
   */
  async addDependency(taskId: string, dependsOnTaskId: string): Promise<Task> {
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, tenantId: this.getTenantId() },
      relations: ['dependencies'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const dependsOnTask = await this.taskRepository.findOne({
      where: { id: dependsOnTaskId, tenantId: this.getTenantId() },
    });

    if (!dependsOnTask) {
      throw new NotFoundException(
        `Dependency task with ID ${dependsOnTaskId} not found`,
      );
    }

    // Check if dependency already exists
    if (task.dependencies.some((dep) => dep.id === dependsOnTaskId)) {
      throw new BadRequestException('Dependency already exists');
    }

    // Check for circular dependencies
    const wouldCreateCycle = await this.wouldCreateCycle(
      taskId,
      dependsOnTaskId,
    );
    if (wouldCreateCycle) {
      throw new BadRequestException(
        'Adding this dependency would create a circular dependency',
      );
    }

    // Check if both tasks are in the same work order
    if (task.workOrderId !== dependsOnTask.workOrderId) {
      throw new BadRequestException(
        'Dependencies can only be created between tasks in the same work order',
      );
    }

    // Add the dependency
    task.dependencies.push(dependsOnTask);
    const updatedTask = await this.taskRepository.save(task);

    // Update task status if needed
    await this.updateTaskReadiness(task);

    this.eventEmitter.emit('task.dependency-added', {
      task: updatedTask,
      dependsOn: dependsOnTask,
    });

    this.logger.log(
      `Added dependency: Task ${taskId} now depends on ${dependsOnTaskId}`,
    );

    return updatedTask;
  }

  /**
   * Remove a dependency between tasks
   */
  async removeDependency(
    taskId: string,
    dependsOnTaskId: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, tenantId: this.getTenantId() },
      relations: ['dependencies'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const dependencyIndex = task.dependencies.findIndex(
      (dep) => dep.id === dependsOnTaskId,
    );
    if (dependencyIndex === -1) {
      throw new NotFoundException('Dependency not found');
    }

    // Remove the dependency
    task.dependencies.splice(dependencyIndex, 1);
    const updatedTask = await this.taskRepository.save(task);

    // Update task status if it can now be started
    await this.updateTaskReadiness(task);

    this.eventEmitter.emit('task.dependency-removed', {
      task: updatedTask,
      removedDependencyId: dependsOnTaskId,
    });

    this.logger.log(
      `Removed dependency: Task ${taskId} no longer depends on ${dependsOnTaskId}`,
    );

    return updatedTask;
  }

  /**
   * Get all dependencies for a task
   */
  async getTaskDependencies(
    taskId: string,
    includeTransitive = false,
  ): Promise<Task[]> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, tenantId: this.getTenantId() },
      relations: ['dependencies'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (!includeTransitive) {
      return task.dependencies;
    }

    // Get transitive dependencies using BFS
    const visited = new Set<string>();
    const queue = [...task.dependencies];
    const allDependencies: Task[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;

      visited.add(current.id);
      allDependencies.push(current);

      // Load dependencies of current task
      const currentWithDeps = await this.taskRepository.findOne({
        where: { id: current.id },
        relations: ['dependencies'],
      });

      if (currentWithDeps?.dependencies) {
        queue.push(...currentWithDeps.dependencies);
      }
    }

    return allDependencies;
  }

  /**
   * Get all tasks that depend on a given task
   */
  async getTaskDependents(
    taskId: string,
    includeTransitive = false,
  ): Promise<Task[]> {
    const directDependents = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.dependencies', 'dependency')
      .where('dependency.id = :taskId', { taskId })
      .andWhere('task.tenantId = :tenantId', { tenantId: this.getTenantId() })
      .getMany();

    if (!includeTransitive) {
      return directDependents;
    }

    // Get transitive dependents using BFS
    const visited = new Set<string>();
    const queue = [...directDependents];
    const allDependents: Task[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;

      visited.add(current.id);
      allDependents.push(current);

      // Find tasks that depend on current
      const currentDependents = await this.taskRepository
        .createQueryBuilder('task')
        .leftJoin('task.dependencies', 'dependency')
        .where('dependency.id = :taskId', { taskId: current.id })
        .andWhere('task.tenantId = :tenantId', { tenantId: this.getTenantId() })
        .getMany();

      queue.push(...currentDependents);
    }

    return allDependents;
  }

  /**
   * Build a dependency graph for a work order
   */
  async buildDependencyGraph(
    workOrderId: string,
  ): Promise<TaskDependencyGraph> {
    const tasks = await this.taskRepository.find({
      where: { workOrderId, tenantId: this.getTenantId() },
      relations: ['dependencies'],
    });

    const nodes = new Map<string, Task>();
    const edges = new Map<string, Set<string>>();
    const reverseEdges = new Map<string, Set<string>>();

    // Build nodes
    for (const task of tasks) {
      nodes.set(task.id, task);
      edges.set(task.id, new Set());
      reverseEdges.set(task.id, new Set());
    }

    // Build edges
    for (const task of tasks) {
      for (const dependency of task.dependencies) {
        edges.get(task.id)!.add(dependency.id);
        reverseEdges.get(dependency.id)!.add(task.id);
      }
    }

    return { nodes, edges, reverseEdges };
  }

  /**
   * Validate dependencies for a work order
   */
  async validateDependencies(
    workOrderId: string,
  ): Promise<DependencyValidationResult> {
    const graph = await this.buildDependencyGraph(workOrderId);
    const issues: string[] = [];

    // Check for circular dependencies
    const circularDependencies = this.findCircularDependencies(graph);
    if (circularDependencies.length > 0) {
      issues.push(
        `Found ${circularDependencies.length} circular dependency chain(s)`,
      );
    }

    // Find tasks with incomplete dependencies
    const incompleteDependencies: Task[] = [];
    const readyTasks: Task[] = [];
    const blockedTasks: Task[] = [];

    for (const [taskId, task] of graph.nodes) {
      const deps = Array.from(graph.edges.get(taskId) || [])
        .map((depId) => graph.nodes.get(depId)!)
        .filter((dep) => dep.status !== TaskStatus.COMPLETED);

      if (deps.length > 0) {
        if (
          task.status === TaskStatus.PENDING ||
          task.status === TaskStatus.READY
        ) {
          blockedTasks.push(task);
          incompleteDependencies.push(...deps);
        }
      } else if (task.status === TaskStatus.PENDING) {
        readyTasks.push(task);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      circularDependencies,
      incompleteDependencies: Array.from(new Set(incompleteDependencies)),
      readyTasks,
      blockedTasks,
    };
  }

  /**
   * Find circular dependencies using DFS
   */
  private findCircularDependencies(graph: TaskDependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = graph.edges.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart).concat(neighbor));
          return true;
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return cycles;
  }

  /**
   * Check if adding a dependency would create a cycle
   */
  private async wouldCreateCycle(
    taskId: string,
    dependsOnTaskId: string,
  ): Promise<boolean> {
    // Check if dependsOnTaskId can reach taskId through existing dependencies
    const visited = new Set<string>();
    const queue = [dependsOnTaskId];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === taskId) {
        return true; // Would create a cycle
      }

      if (visited.has(current)) continue;
      visited.add(current);

      // Get tasks that depend on current
      const dependents = await this.taskRepository
        .createQueryBuilder('task')
        .leftJoin('task.dependencies', 'dependency')
        .where('dependency.id = :taskId', { taskId: current })
        .andWhere('task.tenantId = :tenantId', { tenantId: this.getTenantId() })
        .getMany();

      queue.push(...dependents.map((t) => t.id));
    }

    return false;
  }

  /**
   * Update task readiness based on dependencies
   */
  async updateTaskReadiness(task: Task): Promise<void> {
    const taskWithDeps = await this.taskRepository.findOne({
      where: { id: task.id },
      relations: ['dependencies'],
    });

    if (!taskWithDeps) return;

    // Check if all dependencies are completed
    const allDepsCompleted = taskWithDeps.dependencies.every(
      (dep) => dep.status === TaskStatus.COMPLETED,
    );

    if (allDepsCompleted && taskWithDeps.status === TaskStatus.PENDING) {
      taskWithDeps.status = TaskStatus.READY;
      await this.taskRepository.save(taskWithDeps);

      this.eventEmitter.emit('task.ready', { task: taskWithDeps });
      this.logger.log(
        `Task ${taskWithDeps.taskNumber} is now ready (all dependencies completed)`,
      );
    } else if (!allDepsCompleted && taskWithDeps.status === TaskStatus.READY) {
      taskWithDeps.status = TaskStatus.PENDING;
      await this.taskRepository.save(taskWithDeps);

      this.logger.log(
        `Task ${taskWithDeps.taskNumber} is now pending (has incomplete dependencies)`,
      );
    }
  }

  /**
   * Cascade status updates when a task is completed
   */
  async cascadeCompletionUpdate(completedTaskId: string): Promise<Task[]> {
    const updatedTasks: Task[] = [];

    // Find all tasks that depend on the completed task
    const dependents = await this.getTaskDependents(completedTaskId);

    for (const dependent of dependents) {
      const depWithDeps = await this.taskRepository.findOne({
        where: { id: dependent.id },
        relations: ['dependencies'],
      });

      if (!depWithDeps) continue;

      // Check if all dependencies are now completed
      const allDepsCompleted = depWithDeps.dependencies.every(
        (dep) =>
          dep.id === completedTaskId || dep.status === TaskStatus.COMPLETED,
      );

      if (allDepsCompleted && depWithDeps.status === TaskStatus.PENDING) {
        depWithDeps.status = TaskStatus.READY;
        const updated = await this.taskRepository.save(depWithDeps);
        updatedTasks.push(updated);

        this.eventEmitter.emit('task.ready', { task: updated });
        this.logger.log(
          `Task ${updated.taskNumber} is now ready after dependency completion`,
        );
      }
    }

    return updatedTasks;
  }

  /**
   * Get critical path for a work order
   */
  async getCriticalPath(workOrderId: string): Promise<Task[]> {
    const graph = await this.buildDependencyGraph(workOrderId);
    const criticalPath: Task[] = [];

    // Topological sort to find task order
    const sorted = this.topologicalSort(graph);
    if (!sorted) {
      throw new BadRequestException(
        'Cannot calculate critical path due to circular dependencies',
      );
    }

    // Calculate earliest start and latest finish times
    const earliestStart = new Map<string, number>();
    const latestFinish = new Map<string, number>();
    const taskDuration = new Map<string, number>();

    // Initialize durations
    for (const [taskId, task] of graph.nodes) {
      taskDuration.set(taskId, task.estimatedHours);
      earliestStart.set(taskId, 0);
    }

    // Forward pass - calculate earliest start times
    for (const taskId of sorted) {
      const deps = Array.from(graph.edges.get(taskId) || []);
      let maxEarliestFinish = 0;

      for (const depId of deps) {
        const depFinish = earliestStart.get(depId)! + taskDuration.get(depId)!;
        maxEarliestFinish = Math.max(maxEarliestFinish, depFinish);
      }

      earliestStart.set(taskId, maxEarliestFinish);
    }

    // Find project duration
    let projectDuration = 0;
    for (const [taskId] of graph.nodes) {
      const finish = earliestStart.get(taskId)! + taskDuration.get(taskId)!;
      projectDuration = Math.max(projectDuration, finish);
    }

    // Backward pass - calculate latest finish times
    for (const [taskId] of graph.nodes) {
      latestFinish.set(taskId, projectDuration);
    }

    for (const taskId of sorted.reverse()) {
      const dependents = Array.from(graph.reverseEdges.get(taskId) || []);

      if (dependents.length > 0) {
        let minLatestStart = projectDuration;
        for (const depId of dependents) {
          const depStart = latestFinish.get(depId)! - taskDuration.get(depId)!;
          minLatestStart = Math.min(minLatestStart, depStart);
        }
        latestFinish.set(taskId, minLatestStart);
      }
    }

    // Find critical tasks (zero slack)
    for (const [taskId, task] of graph.nodes) {
      const slack =
        latestFinish.get(taskId)! -
        (earliestStart.get(taskId)! + taskDuration.get(taskId)!);

      if (Math.abs(slack) < 0.01) {
        // Account for floating point precision
        criticalPath.push(task);
      }
    }

    // Sort critical path by earliest start time
    criticalPath.sort(
      (a, b) => earliestStart.get(a.id)! - earliestStart.get(b.id)!,
    );

    return criticalPath;
  }

  /**
   * Topological sort using Kahn's algorithm
   */
  private topologicalSort(graph: TaskDependencyGraph): string[] | null {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const sorted: string[] = [];

    // Calculate in-degrees
    for (const nodeId of graph.nodes.keys()) {
      inDegree.set(nodeId, 0);
    }

    for (const edges of graph.edges.values()) {
      for (const target of edges) {
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
      }
    }

    // Find nodes with no incoming edges
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // Process queue
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      // Reduce in-degree for neighbors
      const neighbors = graph.reverseEdges.get(current) || new Set();
      for (const neighbor of neighbors) {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Check if all nodes were processed (no cycles)
    return sorted.length === graph.nodes.size ? sorted : null;
  }

  /**
   * Split a task and handle dependencies
   */
  async splitTask(
    taskId: string,
    splitConfig: {
      subtasks: Array<{
        name: string;
        description?: string;
        estimatedHours: number;
        targetQuantity: number;
      }>;
      preserveDependencies?: boolean;
    },
  ): Promise<Task[]> {
    const originalTask = await this.taskRepository.findOne({
      where: { id: taskId, tenantId: this.getTenantId() },
      relations: ['dependencies'],
    });

    if (!originalTask) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (
      originalTask.status !== TaskStatus.PENDING &&
      originalTask.status !== TaskStatus.READY
    ) {
      throw new BadRequestException(
        'Can only split tasks that have not started',
      );
    }

    const createdTasks: Task[] = [];
    let previousTask: Task | null = null;

    // Create subtasks
    for (let i = 0; i < splitConfig.subtasks.length; i++) {
      const subtaskConfig = splitConfig.subtasks[i];
      if (!subtaskConfig) continue;

      const subtask = this.taskRepository.create({
        ...originalTask,
        id: undefined,
        taskNumber: `${originalTask.taskNumber}-${i + 1}`,
        name: subtaskConfig.name,
        description: subtaskConfig.description || originalTask.description,
        estimatedHours: subtaskConfig.estimatedHours,
        targetQuantity: subtaskConfig.targetQuantity,
        dependencies: [],
        createdAt: undefined,
        updatedAt: undefined,
      });

      // Set dependencies
      if (splitConfig.preserveDependencies && i === 0) {
        // First subtask inherits original dependencies
        subtask.dependencies = originalTask.dependencies;
      } else if (previousTask) {
        // Each subtask depends on the previous one
        subtask.dependencies = [previousTask];
      }

      const savedSubtask = await this.taskRepository.save(subtask);
      createdTasks.push(savedSubtask);
      previousTask = savedSubtask;
    }

    // Update tasks that depended on the original task
    if (splitConfig.preserveDependencies && createdTasks.length > 0) {
      const dependents = await this.getTaskDependents(taskId);
      const lastSubtask = createdTasks[createdTasks.length - 1];

      for (const dependent of dependents) {
        const depWithDeps = await this.taskRepository.findOne({
          where: { id: dependent.id },
          relations: ['dependencies'],
        });

        if (depWithDeps) {
          // Replace original task with last subtask in dependencies
          const depIndex = depWithDeps.dependencies.findIndex(
            (d) => d.id === taskId,
          );
          if (depIndex !== -1 && lastSubtask) {
            depWithDeps.dependencies[depIndex] = lastSubtask;
            await this.taskRepository.save(depWithDeps);
          }
        }
      }
    }

    // Mark original task as cancelled
    originalTask.status = TaskStatus.CANCELLED;
    originalTask.notes = `Split into ${createdTasks.length} subtasks`;
    await this.taskRepository.save(originalTask);

    this.eventEmitter.emit('task.split', {
      originalTask,
      subtasks: createdTasks,
    });

    this.logger.log(
      `Task ${originalTask.taskNumber} split into ${createdTasks.length} subtasks`,
    );

    return createdTasks;
  }

  private getTenantId(): string {
    return this.clsService.get('tenantId') || 'default';
  }
}
