import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { RequiredActionAlias } from '@keycloak/keycloak-admin-client/lib/defs/requiredActionProviderRepresentation';

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private kcAdminClient: KcAdminClient;
  private realm: string;

  constructor(private configService: ConfigService) {
    this.realm = this.configService.get<string>('KEYCLOAK_REALM', 'mes');
    this.kcAdminClient = new KcAdminClient({
      baseUrl: this.configService.get<string>(
        'KEYCLOAK_AUTH_SERVER_URL',
        'http://localhost:8080',
      ),
      realmName: 'master',
    });
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      await this.kcAdminClient.auth({
        username: this.configService.get<string>(
          'KEYCLOAK_ADMIN_USERNAME',
          'admin',
        ),
        password: this.configService.get<string>(
          'KEYCLOAK_ADMIN_PASSWORD',
          'admin',
        ),
        grantType: 'password',
        clientId: 'admin-cli',
      });
      this.logger.log('Keycloak admin client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Keycloak admin client', error);
    }
  }

  async createUser(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    tenantId: string;
    roles?: string[];
    role?: 'super_admin' | 'executive' | 'admin' | 'worker' | 'sales';
    isAdmin?: boolean;
  }) {
    try {
      // Refresh token before operation
      await this.initializeClient();

      // Debug: Log the realm being used
      this.logger.log(`Creating user in realm: ${this.realm}`);

      // Check if user already exists
      const existingUsers = await this.kcAdminClient.users.find({
        realm: this.realm,
        username: userData.username,
      });

      if (existingUsers.length > 0) {
        throw new BadRequestException(
          `User ${userData.username} already exists`,
        );
      }

      // Create user
      const user = await this.kcAdminClient.users.create({
        realm: this.realm,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
        emailVerified: true,
        attributes: {
          tenant_id: [userData.tenantId],
        },
        requiredActions: [RequiredActionAlias.UPDATE_PASSWORD],
      });

      if (!user.id) {
        throw new Error('Failed to create user - no ID returned');
      }

      // Set password
      await this.kcAdminClient.users.resetPassword({
        realm: this.realm,
        id: user.id,
        credential: {
          temporary: true,
          type: 'password',
          value: userData.password,
        },
      });

      // Assign roles based on the provided role
      let rolesToAssign: string[] = [];

      if (userData.role) {
        // Use the specific role provided
        rolesToAssign = [userData.role];
      } else if (userData.isAdmin) {
        // Legacy support for isAdmin flag
        rolesToAssign = ['admin'];
      } else if (userData.roles) {
        // Use custom roles if provided
        rolesToAssign = userData.roles;
      } else {
        // Default to worker role
        rolesToAssign = ['worker'];
      }

      for (const roleName of rolesToAssign) {
        try {
          const role = await this.kcAdminClient.roles.findOneByName({
            realm: this.realm,
            name: roleName,
          });

          if (role) {
            await this.kcAdminClient.users.addRealmRoleMappings({
              realm: this.realm,
              id: user.id,
              roles: [{ id: role.id!, name: role.name! }],
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to assign role ${roleName}:`, error);
        }
      }

      this.logger.log(`User ${userData.username} created successfully`);
      return {
        id: user.id,
        username: userData.username,
        email: userData.email,
        tenantId: userData.tenantId,
        roles: rolesToAssign,
      };
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async createAdminUser(
    tenantId: string,
    userData?: Partial<{
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role?: 'super_admin' | 'executive' | 'admin' | 'worker' | 'sales';
    }>,
  ) {
    const role = userData?.role || 'admin';
    const rolePrefix =
      role === 'executive' ? 'exec' : role === 'super_admin' ? 'super' : role;

    const defaultData = {
      username: `${rolePrefix}_${tenantId}`,
      email: `${rolePrefix}@${tenantId}.local`,
      firstName: role.charAt(0).toUpperCase() + role.slice(1),
      lastName: tenantId.toUpperCase(),
      password:
        role === 'super_admin' || role === 'admin' || role === 'executive'
          ? 'Admin@123'
          : 'User@123',
    };

    const adminData = {
      ...defaultData,
      ...userData,
      tenantId,
      role: userData?.role || 'admin',
      isAdmin:
        role === 'super_admin' || role === 'admin' || role === 'executive',
    };

    return this.createUser(adminData);
  }

  async createRegularUser(
    tenantId: string,
    userData?: Partial<{
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role?: 'super_admin' | 'executive' | 'admin' | 'worker' | 'sales';
    }>,
  ) {
    const role = userData?.role || 'worker';
    const rolePrefix = role === 'executive' ? 'exec' : role;

    const defaultData = {
      username: `${rolePrefix}_${tenantId}_${Date.now()}`,
      email: `${rolePrefix}@${tenantId}.local`,
      firstName: role.charAt(0).toUpperCase() + role.slice(1),
      lastName: tenantId.toUpperCase(),
      password:
        role === 'admin' || role === 'executive' ? 'Admin@123' : 'User@123',
    };

    const userDataFinal = {
      ...defaultData,
      ...userData,
      tenantId,
      role: userData?.role || 'worker',
      isAdmin: false,
    };

    return this.createUser(userDataFinal);
  }

  async listUsers(tenantId?: string) {
    try {
      await this.initializeClient();

      const users = await this.kcAdminClient.users.find({
        realm: this.realm,
      });

      if (tenantId) {
        return users.filter((user) =>
          user.attributes?.tenant_id?.includes(tenantId),
        );
      }

      return users;
    } catch (error) {
      this.logger.error('Failed to list users:', error);
      throw error;
    }
  }

  async getUserCountByTenant(tenantId: string): Promise<number> {
    try {
      await this.initializeClient();

      // Get all users in the realm
      const users = await this.kcAdminClient.users.find({
        realm: this.realm,
        max: 1000, // Keycloak default max is 100, increase it
      });

      // Filter users by tenant_id attribute
      const tenantUsers = users.filter((user) => {
        const userTenantId = user.attributes?.tenant_id;
        if (Array.isArray(userTenantId)) {
          return userTenantId.includes(tenantId);
        }
        return userTenantId === tenantId;
      });

      this.logger.log(
        `Found ${tenantUsers.length} users for tenant ${tenantId}`,
      );
      return tenantUsers.length;
    } catch (error) {
      this.logger.error(`Failed to count users for tenant ${tenantId}:`, error);
      // Return 0 instead of throwing to not break the tenant listing
      return 0;
    }
  }

  async deleteUser(userId: string) {
    try {
      await this.initializeClient();

      await this.kcAdminClient.users.del({
        realm: this.realm,
        id: userId,
      });

      this.logger.log(`User ${userId} deleted successfully`);
    } catch (error) {
      this.logger.error('Failed to delete user:', error);
      throw error;
    }
  }
}
