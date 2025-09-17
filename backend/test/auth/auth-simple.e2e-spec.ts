import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Authentication Integration Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set global prefix and versioning like in main.ts
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Protected Endpoints', () => {
    it('should reject requests without authentication to profile endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject requests with invalid token to profile endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject requests without authentication to admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/admin-only')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject requests without authentication to executive endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/executive-only')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('API Versioning', () => {
    it('should handle versioned endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(HttpStatus.UNAUTHORIZED); // Expected because no auth token
    });
  });
});
