import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenFgaClient, CredentialsMethod } from '@openfga/sdk';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  private client: OpenFgaClient;
  private storeId: string;

  constructor(private readonly configService: ConfigService) {
    const apiUrl = this.configService.get<string>(
      'OPENFGA_API_URL',
      'http://localhost:8081',
    );
    this.storeId = this.configService.get<string>('OPENFGA_STORE_ID', '');

    // Use no credentials for now, as API token auth requires proper setup
    this.client = new OpenFgaClient({
      apiUrl,
      storeId: this.storeId,
      credentials: {
        method: CredentialsMethod.None,
      },
    });

    this.logger.log(`OpenFGA client initialized with store: ${this.storeId}`);
  }

  async check(
    user: string,
    relation: string,
    object: string,
  ): Promise<boolean> {
    try {
      const { allowed } = await this.client.check({
        user,
        relation,
        object,
      });

      this.logger.debug(
        `Permission check: ${user} ${relation} ${object} = ${allowed}`,
      );
      return allowed ?? false;
    } catch (error: any) {
      this.logger.error(`Permission check failed: ${error?.message || error}`);
      return false;
    }
  }

  async write(user: string, relation: string, object: string): Promise<void> {
    try {
      await this.client.write({
        writes: [
          {
            user,
            relation,
            object,
          },
        ],
      });

      this.logger.debug(`Permission written: ${user} ${relation} ${object}`);
    } catch (error: any) {
      this.logger.error(`Permission write failed: ${error?.message || error}`);
      throw error;
    }
  }

  async delete(user: string, relation: string, object: string): Promise<void> {
    try {
      await this.client.write({
        deletes: [
          {
            user,
            relation,
            object,
          },
        ],
      });

      this.logger.debug(`Permission deleted: ${user} ${relation} ${object}`);
    } catch (error: any) {
      this.logger.error(`Permission delete failed: ${error?.message || error}`);
      throw error;
    }
  }

  async listObjects(
    user: string,
    relation: string,
    type: string,
  ): Promise<string[]> {
    try {
      const response = await this.client.listObjects({
        user,
        relation,
        type,
      });

      return response.objects || [];
    } catch (error: any) {
      this.logger.error(`List objects failed: ${error?.message || error}`);
      return [];
    }
  }

  async listUsers(
    object: string,
    relation: string,
    userFilter?: { type: string },
  ): Promise<any[]> {
    try {
      const [objectType, objectId] = object.split(':');
      if (!objectType || !objectId) {
        throw new Error('Invalid object format, expected type:id');
      }
      const response = await this.client.listUsers({
        object: {
          type: objectType,
          id: objectId,
        },
        relation,
        user_filters: userFilter ? [userFilter] : [],
      });

      return response.users || [];
    } catch (error: any) {
      this.logger.error(`List users failed: ${error?.message || error}`);
      return [];
    }
  }

  // Helper methods for common scenarios
  async assignUserToOrganization(
    userId: string,
    organizationId: string,
    role: 'owner' | 'executive' | 'sales' | 'worker',
  ): Promise<void> {
    await this.write(`user:${userId}`, role, `organization:${organizationId}`);
  }

  async checkOrganizationPermission(
    userId: string,
    organizationId: string,
    permission: 'viewer' | 'editor',
  ): Promise<boolean> {
    return this.check(
      `user:${userId}`,
      permission,
      `organization:${organizationId}`,
    );
  }

  async assignOrderToUser(
    orderId: string,
    userId: string,
    relation: 'creator' | 'assigned',
  ): Promise<void> {
    await this.write(`user:${userId}`, relation, `order:${orderId}`);
  }

  async checkOrderPermission(
    userId: string,
    orderId: string,
    permission: 'viewer' | 'editor',
  ): Promise<boolean> {
    return this.check(`user:${userId}`, permission, `order:${orderId}`);
  }

  async assignTaskToUser(taskId: string, userId: string): Promise<void> {
    await this.write(`user:${userId}`, 'assigned', `task:${taskId}`);
  }

  async checkTaskPermission(
    userId: string,
    taskId: string,
    permission: 'viewer' | 'editor',
  ): Promise<boolean> {
    return this.check(`user:${userId}`, permission, `task:${taskId}`);
  }

  async linkOrderToOrganization(
    orderId: string,
    organizationId: string,
  ): Promise<void> {
    await this.write(
      `organization:${organizationId}`,
      'organization',
      `order:${orderId}`,
    );
  }

  async linkTaskToOrder(taskId: string, orderId: string): Promise<void> {
    await this.write(`order:${orderId}`, 'order', `task:${taskId}`);
  }
}
