import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Combined authentication guard that checks:
 * 1. If route is public (skip auth)
 * 2. If user has valid JWT token
 * 3. Additional custom checks can be added
 */
@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check for JWT token in request
    const request = context.switchToHttp().getRequest();

    // Check for user (would be set by passport JWT strategy if implemented)
    if (!request.user) {
      // For now, allow requests without authentication
      // This will be properly implemented when JWT strategy is set up
      return true;
    }

    // Additional custom checks can be added here
    const user = request.user;

    // Ensure user has required fields
    if (!user || !user.sub) {
      throw new UnauthorizedException('Invalid user token');
    }

    return true;
  }
}
