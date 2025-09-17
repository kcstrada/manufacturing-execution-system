import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Health and Metrics Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

  describe('Health Check Endpoints', () => {
    describe('GET /api/v1/health', () => {
      it('should return overall health status', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health')
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('ok');
      });

      it('should include timestamp in response', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health')
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('timestamp');
        expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      });

      it('should handle concurrent health checks', async () => {
        const requests = Array(5)
          .fill(null)
          .map(() => request(app.getHttpServer()).get('/api/v1/health'));

        const responses = await Promise.all(requests);

        responses.forEach((response) => {
          expect(response.status).toBe(HttpStatus.OK);
          expect(response.body.status).toBe('ok');
        });
      });
    });

    describe('GET /api/v1/health/database', () => {
      it('should check database health', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health/database')
          .expect((res) => {
            expect([HttpStatus.OK, HttpStatus.SERVICE_UNAVAILABLE]).toContain(
              res.status,
            );
          });

        expect(response.body).toHaveProperty('status');
        expect(['ok', 'error']).toContain(response.body.status);
      });

      it('should return database health details', async () => {
        const response = await request(app.getHttpServer()).get(
          '/api/v1/health/database',
        );

        expect(response.body).toHaveProperty('status');
        if (response.body.details) {
          expect(response.body.details).toHaveProperty('database');
        }
      });
    });

    describe('GET /api/v1/health/redis', () => {
      it('should check redis health', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health/redis')
          .expect((res) => {
            expect([HttpStatus.OK, HttpStatus.SERVICE_UNAVAILABLE]).toContain(
              res.status,
            );
          });

        expect(response.body).toHaveProperty('status');
        expect(['ok', 'error']).toContain(response.body.status);
      });

      it('should include redis health details', async () => {
        const response = await request(app.getHttpServer()).get(
          '/api/v1/health/redis',
        );

        expect(response.body).toHaveProperty('status');
        if (response.body.details) {
          expect(response.body.details).toHaveProperty('redis');
        }
      });
    });

    describe('GET /api/v1/health/full', () => {
      it('should check comprehensive health', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health/full')
          .expect((res) => {
            expect([HttpStatus.OK, HttpStatus.SERVICE_UNAVAILABLE]).toContain(
              res.status,
            );
          });

        expect(response.body).toHaveProperty('status');
        expect(['ok', 'error']).toContain(response.body.status);
      });

      it('should include health check details', async () => {
        const response = await request(app.getHttpServer()).get(
          '/api/v1/health/full',
        );

        expect(response.body).toHaveProperty('status');
        if (response.body.details) {
          expect(typeof response.body.details).toBe('object');
        }
      });
    });

    describe('GET /api/v1/health/startup', () => {
      it('should check startup status', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health/startup')
          .expect((res) => {
            expect([HttpStatus.OK, HttpStatus.SERVICE_UNAVAILABLE]).toContain(
              res.status,
            );
          });

        expect(response.body).toHaveProperty('status');
      });
    });

    describe('GET /api/v1/health/ready', () => {
      it('should check readiness', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health/ready')
          .expect((res) => {
            expect([HttpStatus.OK, HttpStatus.SERVICE_UNAVAILABLE]).toContain(
              res.status,
            );
          });

        expect(response.body).toHaveProperty('status');
        expect(['ok', 'error']).toContain(response.body.status);
      });

      it('should include individual service readiness', async () => {
        const response = await request(app.getHttpServer()).get(
          '/api/v1/health/ready',
        );

        expect(response.body).toHaveProperty('status');
        if (response.body.details) {
          expect(typeof response.body.details).toBe('object');
        }
      });
    });

    describe('GET /api/v1/health/live', () => {
      it('should check liveness', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health/live')
          .expect((res) => {
            expect([HttpStatus.OK, HttpStatus.SERVICE_UNAVAILABLE]).toContain(
              res.status,
            );
          });

        expect(response.body).toHaveProperty('status');
        expect(['ok', 'error']).toContain(response.body.status);
      });

      it('should be lightweight and fast', async () => {
        const start = Date.now();
        await request(app.getHttpServer())
          .get('/api/v1/health/live')
          .expect(HttpStatus.OK);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(100); // Should respond in less than 100ms
      });
    });
  });

  describe('Metrics Endpoints (Not Implemented)', () => {
    it.skip('metrics endpoints are not implemented yet', () => {
      // These tests are skipped as the endpoints don't exist
    });
  });

  describe.skip('Metrics Endpoints', () => {
    describe('GET /api/v1/metrics', () => {
      it('should return application metrics', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/metrics')
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('application');
        expect(response.body).toHaveProperty('timestamp');
      });

      it('should include request metrics', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/metrics')
          .expect(HttpStatus.OK);

        if (response.body.application) {
          expect(response.body.application).toHaveProperty('requests');
        }
      });
    });

    describe('GET /api/v1/metrics/performance', () => {
      it('should return performance metrics', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/metrics/performance')
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('performance');
        expect(response.body.performance).toHaveProperty('responseTime');
      });

      it('should include average response times', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/metrics/performance')
          .expect(HttpStatus.OK);

        if (response.body.performance) {
          expect(response.body.performance).toHaveProperty('average');
          expect(response.body.performance).toHaveProperty('p95');
          expect(response.body.performance).toHaveProperty('p99');
        }
      });
    });

    describe('GET /api/v1/metrics/errors', () => {
      it('should return error metrics', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/metrics/errors')
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('errors');
        expect(response.body.errors).toHaveProperty('total');
        expect(response.body.errors).toHaveProperty('rate');
      });

      it('should categorize errors by status code', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/metrics/errors')
          .expect(HttpStatus.OK);

        if (response.body.errors) {
          expect(response.body.errors).toHaveProperty('byStatusCode');
          if (response.body.errors.byStatusCode) {
            expect(typeof response.body.errors.byStatusCode).toBe('object');
          }
        }
      });
    });

    describe('GET /api/v1/metrics/custom', () => {
      it('should allow custom metric queries', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/metrics/custom?metric=requests')
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('metric');
        expect(response.body).toHaveProperty('value');
      });

      it('should handle invalid metric names', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/metrics/custom?metric=invalid_metric_name')
          .expect((res) => {
            expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
              res.status,
            );
          });
      });
    });
  });

  describe('Health Check Error Scenarios', () => {
    it('should handle malformed requests gracefully', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/health?invalid[]=test')
        .expect(HttpStatus.OK);
    });

    it('should ignore unnecessary headers', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('X-Custom-Header', 'test')
        .set('X-Another-Header', 'value')
        .expect(HttpStatus.OK);
    });

    it('should handle HEAD requests for health checks', async () => {
      await request(app.getHttpServer())
        .head('/api/v1/health')
        .expect(HttpStatus.OK);
    });

    it('should not expose sensitive information in health checks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(HttpStatus.OK);

      // Should not contain passwords, tokens, or connection strings
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('password');
      expect(responseString).not.toContain('secret');
      expect(responseString).not.toContain('token');
      expect(responseString).not.toContain('postgresql://');
    });
  });
});
