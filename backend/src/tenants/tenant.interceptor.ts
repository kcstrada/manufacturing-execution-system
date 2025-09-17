import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService } from './tenant.service';
import { RequestWithTenant } from './tenant.middleware';

/**
 * Interceptor to inject tenant context into request-scoped services
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantService: TenantService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    // Set tenant context in the service
    if (request.tenantId) {
      this.tenantService.setTenant(request.tenantId, request.tenant);
    }

    // Add tenant info to response headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-Tenant-ID', request.tenantId || 'default');

    return next.handle();
  }
}
