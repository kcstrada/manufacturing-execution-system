import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, VersioningType, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Comprehensive Auth Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same configuration as main.ts
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Endpoints - Detailed Coverage', () => {
    describe('GET /api/v1/auth/profile', () => {
      it('should reject request without authorization header', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
        expect(response.body).toHaveProperty('message');
      });

      it('should reject request with empty authorization header', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', '')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject request with malformed authorization header', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', 'InvalidFormat token')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject request with Bearer but no token', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', 'Bearer ')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject request with invalid JWT token', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', 'Bearer invalid.jwt.token')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should handle special characters in invalid token', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', 'Bearer @#$%^&*()')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should handle very long invalid tokens', async () => {
        const longToken = 'a'.repeat(5000);
        await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${longToken}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('GET /api/v1/auth/roles', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/roles')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject invalid Bearer token', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/roles')
          .set('Authorization', 'Bearer invalid')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('GET /api/v1/auth/admin-only', () => {
      it('should require authentication', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/admin-only')
          .expect(HttpStatus.UNAUTHORIZED);

        expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      });

      it('should handle OPTIONS request', async () => {
        await request(app.getHttpServer())
          .options('/api/v1/auth/admin-only')
          .expect((res) => {
            expect(res.status).toBeLessThanOrEqual(204);
          });
      });

      it('should handle HEAD request', async () => {
        await request(app.getHttpServer())
          .head('/api/v1/auth/admin-only')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('GET /api/v1/auth/executive-only', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/executive-only')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should handle case-sensitive paths correctly', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/Executive-Only')
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('GET /api/v1/auth/sales-only', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/sales-only')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('GET /api/v1/auth/worker-only', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/worker-only')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('Request Validation and Error Handling', () => {
    it('should handle non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/non-existent')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle wrong HTTP methods', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/profile')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle PUT requests to GET endpoints', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/auth/profile')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle DELETE requests to GET endpoints', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/auth/profile')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle PATCH requests to GET endpoints', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/auth/profile')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('API Versioning Tests', () => {
    it('should handle v1 endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent versions', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/auth/profile')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for v0', async () => {
      await request(app.getHttpServer())
        .get('/api/v0/auth/profile')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle requests without version', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Security Headers and Response Format', () => {
    it('should not expose sensitive headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile');

      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should return proper content-type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile');

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should handle request with query parameters', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile?test=123&foo=bar')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle URL encoded parameters', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile?name=test%20user&value=%40%23%24')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', 'Bearer invalid')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
    });

    it('should handle rapid sequential requests', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .expect(HttpStatus.UNAUTHORIZED);
      }
    });
  });

  describe('Special Cases and Edge Cases', () => {
    it('should handle request with multiple authorization headers', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer token1')
        .set('Authorization', 'Bearer token2')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle Unicode characters in headers', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer τοκεν')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle null byte injection attempts', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile\0')
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });
    });

    it('should handle path traversal attempts', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/../../../etc/passwd')
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});