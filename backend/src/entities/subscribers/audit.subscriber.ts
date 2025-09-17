import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
  RecoverEvent,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { REQUEST_CONTEXT } from '../../common/constants';

/**
 * Subscriber to automatically populate audit fields
 * Captures user context from request and populates createdBy, updatedBy, deletedBy
 */
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<BaseEntity> {
  /**
   * Indicates that this subscriber only listens to BaseEntity events
   */
  listenTo() {
    return BaseEntity;
  }

  /**
   * Called before entity insertion
   */
  async beforeInsert(event: InsertEvent<BaseEntity>) {
    const userId = this.getUserIdFromContext();
    if (event.entity) {
      // Set createdBy if the entity has this field
      if ('createdBy' in event.entity && userId) {
        (event.entity as any).createdBy = userId;
      }
      // Set updatedBy if the entity has this field
      if ('updatedBy' in event.entity && userId) {
        (event.entity as any).updatedBy = userId;
      }
      event.entity.isActive = event.entity.isActive ?? true;
    }
  }

  /**
   * Called before entity update
   */
  async beforeUpdate(event: UpdateEvent<BaseEntity>) {
    const userId = this.getUserIdFromContext();
    if (event.entity) {
      // Set updatedBy if the entity has this field
      if ('updatedBy' in event.entity && userId) {
        (event.entity as any).updatedBy = userId;
      }
    }
  }

  /**
   * Called before entity soft removal
   */
  async beforeSoftRemove(event: SoftRemoveEvent<BaseEntity>) {
    const userId = this.getUserIdFromContext();
    if (event.entity) {
      // Set deletedBy if the entity has this field
      if ('deletedBy' in event.entity && userId) {
        (event.entity as any).deletedBy = userId;
      }
      event.entity.isActive = false;
    }
  }

  /**
   * Called before entity hard removal
   */
  async beforeRemove(event: RemoveEvent<BaseEntity>) {
    const userId = this.getUserIdFromContext();
    if (event.entity) {
      // Set deletedBy if the entity has this field
      if ('deletedBy' in event.entity && userId) {
        (event.entity as any).deletedBy = userId;
      }
      event.entity.isActive = false;
    }
  }

  /**
   * Called before entity recovery
   */
  async beforeRecover(event: RecoverEvent<BaseEntity>) {
    const userId = this.getUserIdFromContext();
    if (event.entity) {
      // Set updatedBy if the entity has this field
      if ('updatedBy' in event.entity && userId) {
        (event.entity as any).updatedBy = userId;
      }
      // Clear deletedBy if the entity has this field
      if ('deletedBy' in event.entity) {
        (event.entity as any).deletedBy = undefined;
      }
      event.entity.isActive = true;
    }
  }

  /**
   * Extract user ID from request context
   * This requires setting up a request-scoped context provider
   */
  private getUserIdFromContext(): string | undefined {
    try {
      // This assumes you have a request context provider
      // You'll need to implement this based on your authentication setup
      const context = (global as any)[REQUEST_CONTEXT];
      return context?.user?.id || context?.userId;
    } catch (error) {
      // If context is not available, return undefined
      return undefined;
    }
  }
}
