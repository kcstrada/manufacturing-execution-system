import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly configService: ConfigService) {}

  async validateUser(payload: any): Promise<any> {
    this.logger.debug(`Validating user: ${payload.preferred_username}`);
    
    return {
      userId: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      realm_access: payload.realm_access,
      resource_access: payload.resource_access,
      tenant_id: payload.tenant_id,
      worker_id: payload.worker_id,
    };
  }

  extractRoles(payload: any): string[] {
    const realmRoles = payload.realm_access?.roles || [];
    const resourceRoles = payload.resource_access?.[this.configService.get('KEYCLOAK_CLIENT_ID')]?.roles || [];
    
    return [...new Set([...realmRoles, ...resourceRoles])];
  }

  hasRole(payload: any, role: string): boolean {
    const roles = this.extractRoles(payload);
    return roles.includes(role);
  }

  hasAnyRole(payload: any, roles: string[]): boolean {
    const userRoles = this.extractRoles(payload);
    return roles.some(role => userRoles.includes(role));
  }
}