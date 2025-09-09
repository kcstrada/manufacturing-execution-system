import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_USERNAME = 'test';
process.env.DATABASE_PASSWORD = 'test';
process.env.DATABASE_NAME = 'mes_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.KEYCLOAK_REALM = 'test-realm';
process.env.KEYCLOAK_CLIENT_ID = 'test-client';
process.env.KEYCLOAK_CLIENT_SECRET = 'test-secret';
process.env.KEYCLOAK_AUTH_SERVER_URL = 'http://localhost:8080/auth';
process.env.OPENFGA_STORE_ID = 'test-store';
process.env.OPENFGA_API_URL = 'http://localhost:8080';

// Global test utilities
export const createTestApp = async (moduleRef: any): Promise<INestApplication> => {
  const app = moduleRef.createNestApplication();
  
  // Apply the same pipes and middleware as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  return app;
};

// JWT token generation for testing
export const generateTestToken = (payload: any): string => {
  // This would normally use jsonwebtoken library
  // For testing, we'll return a mock token
  return 'Bearer test-jwt-token-' + Buffer.from(JSON.stringify(payload)).toString('base64');
};

// Test user fixtures
export const testUsers = {
  admin: {
    id: '1',
    username: 'admin@test.com',
    email: 'admin@test.com',
    roles: ['Admin'],
    tenantId: 'tenant-1',
    permissions: ['*'],
  },
  executive: {
    id: '2',
    username: 'executive@test.com',
    email: 'executive@test.com',
    roles: ['Executive'],
    tenantId: 'tenant-1',
    permissions: ['read:*', 'write:reports'],
  },
  sales: {
    id: '3',
    username: 'sales@test.com',
    email: 'sales@test.com',
    roles: ['Sales'],
    tenantId: 'tenant-1',
    permissions: ['read:orders', 'write:orders', 'read:products'],
  },
  worker: {
    id: '4',
    username: 'worker@test.com',
    email: 'worker@test.com',
    roles: ['Worker'],
    tenantId: 'tenant-1',
    permissions: ['read:tasks', 'write:tasks:own'],
  },
  differentTenant: {
    id: '5',
    username: 'user@tenant2.com',
    email: 'user@tenant2.com',
    roles: ['Admin'],
    tenantId: 'tenant-2',
    permissions: ['*'],
  },
};

// Helper to make authenticated requests
export const makeAuthenticatedRequest = (
  app: INestApplication,
  user: any,
) => {
  const token = generateTestToken(user);
  return {
    get: (url: string) => request(app.getHttpServer()).get(url).set('Authorization', token),
    post: (url: string) => request(app.getHttpServer()).post(url).set('Authorization', token),
    put: (url: string) => request(app.getHttpServer()).put(url).set('Authorization', token),
    patch: (url: string) => request(app.getHttpServer()).patch(url).set('Authorization', token),
    delete: (url: string) => request(app.getHttpServer()).delete(url).set('Authorization', token),
  };
};

// Database cleanup utilities
export const cleanupDatabase = async (connection: any) => {
  const entities = connection.entityMetadatas;
  for (const entity of entities) {
    const repository = connection.getRepository(entity.name);
    await repository.query(`TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
  }
};

// Mock services for testing
export const createMockKeycloakService = () => ({
  validateToken: jest.fn().mockImplementation((token: string) => {
    const base64 = token.replace('Bearer test-jwt-token-', '');
    try {
      return JSON.parse(Buffer.from(base64, 'base64').toString());
    } catch {
      return null;
    }
  }),
  getUserRoles: jest.fn().mockImplementation((userId: string) => {
    const user = Object.values(testUsers).find(u => u.id === userId);
    return user?.roles || [];
  }),
  refreshToken: jest.fn().mockResolvedValue('new-token'),
});

export const createMockOpenFGAService = () => ({
  checkPermission: jest.fn().mockImplementation((userId: string, resource: string, action: string) => {
    const user = Object.values(testUsers).find(u => u.id === userId);
    if (!user) return false;
    
    // Check if user has wildcard permission
    if (user.permissions.includes('*')) return true;
    
    // Check specific permissions
    const permission = `${action}:${resource}`;
    return user.permissions.some(p => {
      if (p === permission) return true;
      if (p.endsWith(':*') && permission.startsWith(p.replace(':*', ''))) return true;
      return false;
    });
  }),
  createRelationship: jest.fn().mockResolvedValue(true),
  deleteRelationship: jest.fn().mockResolvedValue(true),
});

// Wait for condition helper
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
};

// Test data factories
export const createTestOrder = (overrides = {}) => ({
  id: '1',
  orderNumber: 'ORD-001',
  customerId: 'CUST-001',
  status: 'pending',
  items: [],
  totalAmount: 1000,
  tenantId: 'tenant-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestTask = (overrides = {}) => ({
  id: '1',
  title: 'Test Task',
  description: 'Test task description',
  status: 'pending',
  assignedTo: null,
  orderId: '1',
  tenantId: 'tenant-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestProduct = (overrides = {}) => ({
  id: '1',
  sku: 'PROD-001',
  name: 'Test Product',
  description: 'Test product description',
  price: 100,
  stockLevel: 50,
  tenantId: 'tenant-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Global test setup
beforeAll(async () => {
  // Any global setup needed
});

afterAll(async () => {
  // Global cleanup
  await new Promise(resolve => setTimeout(resolve, 500)); // Allow connections to close
});