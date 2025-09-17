import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import * as bcrypt from 'bcrypt';

/**
 * Authentication test helper utilities
 */

export interface TestUser {
  id: string;
  email: string;
  username: string;
  password?: string;
  roles: string[];
  tenantId: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Generate JWT tokens for testing
 */
export class AuthTestHelper {
  constructor(
    private readonly app: INestApplication,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Create a valid JWT token for a test user
   */
  generateToken(user: TestUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      tenantId: user.tenantId,
      permissions: user.permissions || [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generate expired token for testing
   */
  generateExpiredToken(user: TestUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      tenantId: user.tenantId,
      permissions: user.permissions || [],
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    };

    return this.jwtService.sign(payload, { expiresIn: '0s' });
  }

  /**
   * Create refresh token
   */
  generateRefreshToken(user: TestUser): string {
    const payload = {
      sub: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 604800, // 7 days
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Login a test user and get tokens
   */
  async login(username: string, password: string): Promise<AuthTokens> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username, password });

    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.body.message}`);
    }

    return {
      accessToken: response.body.access_token,
      refreshToken: response.body.refresh_token,
      expiresIn: response.body.expires_in,
      tokenType: response.body.token_type || 'Bearer',
    };
  }

  /**
   * Create authenticated request helper
   */
  createAuthenticatedRequest(token: string) {
    const server = this.app.getHttpServer();

    return {
      get: (url: string) =>
        request(server).get(url).set('Authorization', `Bearer ${token}`),
      post: (url: string) =>
        request(server).post(url).set('Authorization', `Bearer ${token}`),
      put: (url: string) =>
        request(server).put(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) =>
        request(server).patch(url).set('Authorization', `Bearer ${token}`),
      delete: (url: string) =>
        request(server).delete(url).set('Authorization', `Bearer ${token}`),
    };
  }

  /**
   * Hash password for testing
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Extract claims from token
   */
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  /**
   * Verify token signature
   */
  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Create test user in database
   */
  async createTestUser(user: Partial<TestUser>): Promise<TestUser> {
    const defaultUser: TestUser = {
      id: `test-user-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      password: 'Test123!',
      roles: ['User'],
      tenantId: 'test-tenant',
      permissions: [],
      ...user,
    };

    // Hash password if provided
    if (defaultUser.password) {
      defaultUser.password = await this.hashPassword(defaultUser.password);
    }

    // Here you would save to database
    // For testing, we'll return the user object
    return defaultUser;
  }

  /**
   * Simulate MFA flow
   */
  async simulateMFA(
    user: TestUser,
    code: string = '123456',
  ): Promise<AuthTokens> {
    // First login to get MFA challenge
    const loginResponse = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: user.username,
        password: user.password,
      });

    if (loginResponse.body.requiresMfa) {
      // Submit MFA code
      const mfaResponse = await request(this.app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          mfaToken: loginResponse.body.mfaToken,
          code,
        });

      return {
        accessToken: mfaResponse.body.access_token,
        refreshToken: mfaResponse.body.refresh_token,
        expiresIn: mfaResponse.body.expires_in,
        tokenType: 'Bearer',
      };
    }

    return {
      accessToken: loginResponse.body.access_token,
      refreshToken: loginResponse.body.refresh_token,
      expiresIn: loginResponse.body.expires_in,
      tokenType: 'Bearer',
    };
  }

  /**
   * Test rate limiting
   */
  async testRateLimit(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    limit: number,
    token?: string,
  ): Promise<boolean> {
    const requests = [];

    for (let i = 0; i < limit + 5; i++) {
      let req = request(this.app.getHttpServer())[method.toLowerCase()](
        endpoint,
      );

      if (token) {
        req = req.set('Authorization', `Bearer ${token}`);
      }

      requests.push(req);
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some((r) => r.status === 429);

    return rateLimited;
  }

  /**
   * Test session management
   */
  async createSession(user: TestUser): Promise<string> {
    const token = this.generateToken(user);

    // Store session (mock implementation)
    await request(this.app.getHttpServer())
      .post('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceInfo: {
          userAgent: 'Test Client',
          ip: '127.0.0.1',
        },
      });

    return token;
  }

  /**
   * Invalidate session
   */
  async invalidateSession(token: string): Promise<void> {
    await request(this.app.getHttpServer())
      .delete('/api/v1/auth/sessions/current')
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Test password reset flow
   */
  async testPasswordReset(email: string): Promise<string> {
    // Request password reset
    const resetResponse = await request(this.app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email });

    // In test environment, return the reset token directly
    // In production, this would be sent via email
    return resetResponse.body.resetToken || 'test-reset-token';
  }

  /**
   * Complete password reset
   */
  async completePasswordReset(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({
        token,
        newPassword,
      });

    return response.status === 200;
  }
}

/**
 * Mock authentication service for testing
 */
export class MockAuthService {
  private users: Map<string, TestUser> = new Map();
  private sessions: Map<string, string> = new Map();

  addUser(user: TestUser): void {
    this.users.set(user.id, user);
  }

  getUser(id: string): TestUser | undefined {
    return this.users.get(id);
  }

  validateCredentials(username: string, password: string): TestUser | null {
    const user = Array.from(this.users.values()).find(
      (u) => u.username === username || u.email === username,
    );

    if (user && user.password === password) {
      return user;
    }

    return null;
  }

  createSession(userId: string, token: string): void {
    this.sessions.set(token, userId);
  }

  validateSession(token: string): string | undefined {
    return this.sessions.get(token);
  }

  invalidateSession(token: string): void {
    this.sessions.delete(token);
  }

  invalidateAllUserSessions(userId: string): void {
    for (const [token, uid] of this.sessions.entries()) {
      if (uid === userId) {
        this.sessions.delete(token);
      }
    }
  }
}

/**
 * Permission test helper
 */
export class PermissionTestHelper {
  constructor(private readonly app: INestApplication) {}

  /**
   * Test if user has permission
   */
  async checkPermission(
    token: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/check-permission')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource, action });

    return response.status === 200 && response.body.hasPermission === true;
  }

  /**
   * Grant permission to user
   */
  async grantPermission(
    adminToken: string,
    userId: string,
    permission: string,
  ): Promise<boolean> {
    const response = await request(this.app.getHttpServer())
      .post(`/api/v1/users/${userId}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permission });

    return response.status === 200;
  }

  /**
   * Revoke permission from user
   */
  async revokePermission(
    adminToken: string,
    userId: string,
    permission: string,
  ): Promise<boolean> {
    const response = await request(this.app.getHttpServer())
      .delete(`/api/v1/users/${userId}/permissions/${permission}`)
      .set('Authorization', `Bearer ${adminToken}`);

    return response.status === 200;
  }

  /**
   * Test role-based access
   */
  async testRoleAccess(
    token: string,
    endpoint: string,
    expectedStatus: number,
  ): Promise<boolean> {
    const response = await request(this.app.getHttpServer())
      .get(endpoint)
      .set('Authorization', `Bearer ${token}`);

    return response.status === expectedStatus;
  }
}

/**
 * Tenant test helper
 */
export class TenantTestHelper {
  constructor(private readonly app: INestApplication) {}

  /**
   * Create test tenant
   */
  async createTenant(adminToken: string, tenant: any): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/admin/tenants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(tenant);

    return response.body.id;
  }

  /**
   * Switch tenant context
   */
  async switchTenant(token: string, tenantId: string): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/tenants/switch')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId });

    return response.body.token;
  }

  /**
   * Test tenant isolation
   */
  async testTenantIsolation(
    tenant1Token: string,
    tenant2Token: string,
    endpoint: string,
  ): Promise<boolean> {
    // Create resource with tenant1
    const createResponse = await request(this.app.getHttpServer())
      .post(endpoint)
      .set('Authorization', `Bearer ${tenant1Token}`)
      .send({ name: 'Test Resource' });

    const resourceId = createResponse.body.id;

    // Try to access with tenant2
    const accessResponse = await request(this.app.getHttpServer())
      .get(`${endpoint}/${resourceId}`)
      .set('Authorization', `Bearer ${tenant2Token}`);

    // Should not be able to access
    return accessResponse.status === 404 || accessResponse.status === 403;
  }
}
