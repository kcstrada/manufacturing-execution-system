import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithTenant extends Request {
  tenantId?: string;
  tenant?: {
    id: string;
    name?: string;
    subdomain?: string;
    customDomain?: string;
  };
}

/**
 * Middleware for multi-tenant isolation
 * Extracts tenant information from various sources and adds it to the request
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, _res: Response, next: NextFunction) {
    // Extract tenant from various sources (in order of priority)
    const tenantId = this.extractTenantId(req);

    if (!tenantId) {
      // If no tenant found, use default tenant
      req.tenantId = 'default';
      req.tenant = {
        id: 'default',
        name: 'Default Tenant',
      };
    } else {
      req.tenantId = tenantId;
      req.tenant = {
        id: tenantId,
        name: this.getTenantName(tenantId),
        subdomain: this.extractSubdomain(req) ?? undefined,
        customDomain: this.extractCustomDomain(req) ?? undefined,
      };
    }

    // Log tenant context for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Tenant Middleware] Request for tenant: ${req.tenantId}`);
    }

    next();
  }

  /**
   * Extract tenant ID from various sources
   */
  private extractTenantId(req: RequestWithTenant): string | null {
    // 1. Check JWT token claims (highest priority)
    if (req.user && (req.user as any).tenant_id) {
      return (req.user as any).tenant_id;
    }

    // 2. Check X-Tenant-ID header
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      return headerTenantId;
    }

    // 3. Check subdomain
    const subdomain = this.extractSubdomain(req);
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return this.mapSubdomainToTenantId(subdomain);
    }

    // 4. Check query parameter (lowest priority, mainly for testing)
    if (req.query.tenantId && typeof req.query.tenantId === 'string') {
      return req.query.tenantId;
    }

    // 5. Check custom domain mapping
    const customDomain = this.extractCustomDomain(req);
    if (customDomain) {
      return this.mapCustomDomainToTenantId(customDomain);
    }

    return null;
  }

  /**
   * Extract subdomain from request
   */
  private extractSubdomain(req: Request): string | null {
    const host = req.get('host');
    if (!host) return null;

    // Remove port if present
    const hostname = host.split(':')[0];
    if (!hostname) return null;

    // Split by dots
    const parts = hostname.split('.');

    // If we have at least 3 parts (subdomain.domain.tld), extract subdomain
    if (parts.length >= 3) {
      return parts[0] ?? null;
    }

    return null;
  }

  /**
   * Extract custom domain from request
   */
  private extractCustomDomain(req: Request): string | null {
    const host = req.get('host');
    if (!host) return null;

    // Remove port if present
    const hostname = host.split(':')[0];
    if (!hostname) return null;

    // Check if this is a custom domain (not localhost or standard domains)
    if (
      !hostname.includes('localhost') &&
      !hostname.includes('127.0.0.1') &&
      !hostname.endsWith('.local')
    ) {
      return hostname;
    }

    return null;
  }

  /**
   * Map subdomain to tenant ID
   * In production, this would query a database or cache
   */
  private mapSubdomainToTenantId(subdomain: string): string {
    // Example mapping - in production, this would be from database
    const subdomainMap: Record<string, string> = {
      acme: 'tenant-acme',
      globex: 'tenant-globex',
      initech: 'tenant-initech',
    };

    return subdomainMap[subdomain] || subdomain;
  }

  /**
   * Map custom domain to tenant ID
   * In production, this would query a database or cache
   */
  private mapCustomDomainToTenantId(domain: string): string {
    // Example mapping - in production, this would be from database
    const domainMap: Record<string, string> = {
      'acme-corp.com': 'tenant-acme',
      'globex-corp.com': 'tenant-globex',
      'initech.io': 'tenant-initech',
    };

    return domainMap[domain] || 'default';
  }

  /**
   * Get tenant name from tenant ID
   * In production, this would query a database or cache
   */
  private getTenantName(tenantId: string): string {
    // Example mapping - in production, this would be from database
    const tenantNames: Record<string, string> = {
      default: 'Default Tenant',
      'tenant-acme': 'ACME Corporation',
      'tenant-globex': 'Globex Corporation',
      'tenant-initech': 'Initech Solutions',
    };

    return tenantNames[tenantId] || tenantId;
  }
}
