import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoggingService } from './logging.service';

/**
 * Controller for testing logging functionality
 */
@ApiTags('Logging')
@Controller('api/logging')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test logging levels' })
  @ApiResponse({ status: 200, description: 'Logging test completed' })
  testLogging() {
    this.loggingService.setContext('LoggingController');

    this.loggingService.log('This is an info log');
    this.loggingService.warn('This is a warning log');
    this.loggingService.debug('This is a debug log');
    this.loggingService.verbose('This is a verbose log');
    this.loggingService.http('This is an HTTP log', {
      method: 'GET',
      path: '/test',
    });

    return {
      message: 'Logging test completed',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('performance')
  @ApiOperation({ summary: 'Test performance logging' })
  @ApiResponse({ status: 200, description: 'Performance test completed' })
  async testPerformance() {
    const startTime = Date.now();

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 100));

    const duration = Date.now() - startTime;
    this.loggingService.performance('Test operation', duration, {
      threshold: 50,
      exceeded: duration > 50,
    });

    return {
      message: 'Performance test completed',
      duration,
    };
  }

  @Post('audit')
  @ApiOperation({ summary: 'Test audit logging' })
  @ApiResponse({ status: 201, description: 'Audit log created' })
  testAudit(@Body() body: { action: string; resource: string }) {
    this.loggingService.audit(
      body.action || 'TEST_ACTION',
      'test-user-123',
      body.resource || 'test-resource',
      { additional: 'metadata' },
    );

    return {
      message: 'Audit log created',
      action: body.action,
      resource: body.resource,
    };
  }

  @Get('security')
  @ApiOperation({ summary: 'Test security logging' })
  @ApiResponse({ status: 200, description: 'Security log created' })
  testSecurity() {
    this.loggingService.security('Suspicious login attempt', 'medium', {
      ip: '192.168.1.1',
      attempts: 3,
    });

    return {
      message: 'Security log created',
    };
  }

  @Get('error')
  @ApiOperation({ summary: 'Test error logging' })
  @ApiResponse({ status: 500, description: 'Error thrown for testing' })
  testError() {
    this.loggingService.error(
      'This is a test error',
      'Stack trace here',
      'TEST_ERROR',
    );
    throw new HttpException(
      'Test error for logging',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  @Get('validation-error')
  @ApiOperation({ summary: 'Test validation error logging' })
  @ApiResponse({ status: 400, description: 'Validation error thrown' })
  testValidationError() {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ],
    });
  }

  @Get('cache')
  @ApiOperation({ summary: 'Test cache logging' })
  @ApiResponse({ status: 200, description: 'Cache logs created' })
  testCache() {
    this.loggingService.cache('hit', 'user:123', { ttl: 300 });
    this.loggingService.cache('miss', 'user:456');
    this.loggingService.cache('set', 'user:789', { value: 'cached data' });
    this.loggingService.cache('delete', 'user:000');

    return {
      message: 'Cache logs created',
    };
  }

  @Get('queue')
  @ApiOperation({ summary: 'Test queue logging' })
  @ApiResponse({ status: 200, description: 'Queue logs created' })
  testQueue() {
    this.loggingService.queue('email', 'job.created', 'job-123');
    this.loggingService.queue('email', 'job.processing', 'job-123');
    this.loggingService.queue('email', 'job.completed', 'job-123', {
      duration: 250,
    });

    return {
      message: 'Queue logs created',
    };
  }

  @Get('child-logger')
  @ApiOperation({ summary: 'Test child logger with context' })
  @ApiResponse({ status: 200, description: 'Child logger test completed' })
  testChildLogger() {
    const childLogger = this.loggingService.child('ChildContext');

    childLogger.log('Log from child logger');
    childLogger.warn('Warning from child logger');
    childLogger.debug('Debug from child logger');

    return {
      message: 'Child logger test completed',
    };
  }
}
