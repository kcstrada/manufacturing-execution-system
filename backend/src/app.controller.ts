import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'nest-keycloak-connect';
import { AppService } from './app.service';
import { PublicRateLimit } from './common/decorators/rate-limit.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @PublicRateLimit() // Relaxed rate limit for public endpoint
  @ApiOperation({ 
    summary: 'Get API welcome message',
    description: 'Returns a welcome message from the API'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Welcome message returned successfully',
    type: String
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @SkipThrottle() // No rate limiting for health checks
  @ApiOperation({ 
    summary: 'Basic health check',
    description: 'Simple health check endpoint for load balancers'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        service: { type: 'string', example: 'Manufacturing Execution System API' }
      }
    }
  })
  healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Manufacturing Execution System API',
    };
  }
}
