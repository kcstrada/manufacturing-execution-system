import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { createWinstonConfig } from './logging/winston.config';
import { getCorsConfig, getHelmetConfig } from './config/security.config';
import { getValidationPipeConfig } from './common/validation/validation.config';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  // Determine environment
  const isProduction = process.env.NODE_ENV === 'production';

  // Create Winston logger instance with our custom configuration
  const logger = WinstonModule.createLogger(createWinstonConfig(isProduction));

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const corsOrigins = configService.get<string>(
    'CORS_ORIGINS',
    'http://localhost:3001,http://localhost:3002',
  );

  // Security Headers with Helmet
  app.use(helmet(getHelmetConfig()));

  // CORS Configuration
  app.enableCors(getCorsConfig(corsOrigins));

  // Additional Security Headers
  app.use((req: any, res: any, next: any) => {
    // Request ID for tracing
    const requestId =
      req.headers['x-request-id'] ||
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-Id', requestId);

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );

    // Remove fingerprinting headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
  });

  // Global prefix (set before versioning)
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global validation pipe with enhanced configuration
  app.useGlobalPipes(new ValidationPipe(getValidationPipeConfig(isProduction)));

  // Global validation exception filter
  app.useGlobalFilters(new ValidationExceptionFilter());

  // Swagger documentation
  const enableSwagger = configService.get<boolean>('SWAGGER_ENABLED', true);
  if (enableSwagger && configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Manufacturing Execution System API')
      .setDescription(
        'API documentation for the Manufacturing Execution System',
      )
      .setVersion('1.0')
      .setContact(
        'MES Support',
        'https://github.com/your-org/mes',
        'support@mes.example.com',
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key for service-to-service authentication',
        },
        'api-key',
      )
      .addServer(`http://localhost:${port}`, 'Local Development')
      .addServer('https://api.mes.example.com', 'Production')
      .addTag('auth', 'Authentication endpoints')
      .addTag('health', 'Health check and monitoring endpoints')
      .addTag('metrics', 'Application metrics endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('tenants', 'Tenant management endpoints')
      .addTag('permissions', 'Permission management endpoints')
      .addTag('orders', 'Order management endpoints')
      .addTag('inventory', 'Inventory management endpoints')
      .addTag('tasks', 'Task management endpoints')
      .addTag('workers', 'Worker management endpoints')
      .addTag('products', 'Product management endpoints')
      .addTag('equipment', 'Equipment management endpoints')
      .addTag('quality', 'Quality control endpoints')
      .addTag('reports', 'Reporting endpoints')
      .addTag('websockets', 'WebSocket events documentation')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (_controllerKey: string, methodKey: string) =>
        methodKey,
      deepScanRoutes: true,
    });

    // Custom Swagger UI options
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        syntaxHighlight: {
          theme: 'monokai',
        },
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        requestSnippets: {
          generators: {
            curl_bash: {
              title: 'cURL (bash)',
              syntax: 'bash',
            },
            node_fetch: {
              title: 'Node.js (fetch)',
              syntax: 'javascript',
            },
            javascript_fetch: {
              title: 'JavaScript (fetch)',
              syntax: 'javascript',
            },
          },
        },
      },
      customSiteTitle: 'MES API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin-bottom: 20px }
        .swagger-ui .scheme-container { margin-bottom: 20px }
      `,
    });

    // Also serve OpenAPI JSON spec
    app.getHttpAdapter().get(`/${apiPrefix}/docs-json`, (_req, res) => {
      res.json(document);
    });

    logger.log(
      `📚 Swagger documentation available at: http://localhost:${port}/${apiPrefix}/docs`,
    );
    logger.log(
      `📄 OpenAPI JSON spec available at: http://localhost:${port}/${apiPrefix}/docs-json`,
    );
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(
    `📚 API Documentation available at: http://localhost:${port}/${apiPrefix}/docs`,
  );
}

bootstrap();
