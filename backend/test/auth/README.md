# Authentication & Authorization Integration Tests

## Overview

This directory contains comprehensive integration tests for the authentication and authorization system of the Manufacturing Execution System (MES). These tests ensure the security, reliability, and correctness of the auth flow across all components.

## Test Coverage

### 1. Authentication Integration Tests (`auth-integration.e2e-spec.ts`)

#### Authentication Flow
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Request body validation
- ✅ Rate limiting protection
- ✅ Token refresh mechanism
- ✅ Logout functionality

#### Token Management
- ✅ JWT token validation
- ✅ Expired token handling
- ✅ Malformed token rejection
- ✅ Missing authorization header handling

#### Session Management
- ✅ Active session tracking
- ✅ Session invalidation on password change
- ✅ Concurrent session handling
- ✅ Session timeout

#### Multi-Factor Authentication (MFA)
- ✅ MFA requirement detection
- ✅ MFA code validation
- ✅ Invalid MFA code rejection
- ✅ MFA bypass for trusted devices

#### Password Management
- ✅ Password reset initiation
- ✅ Password reset completion
- ✅ Invalid reset token handling
- ✅ Password complexity validation

### 2. Authorization Integration Tests (`authorization-integration.e2e-spec.ts`)

#### Role-Based Access Control (RBAC)
- ✅ Admin role - full access
- ✅ Executive role - reports and analytics
- ✅ Sales role - order management
- ✅ Worker role - task management
- ✅ Role hierarchy enforcement

#### Permission-Based Access Control (PBAC)
- ✅ Resource-specific permissions
- ✅ Hierarchical permissions
- ✅ Time-based permissions
- ✅ Conditional permissions
- ✅ Permission delegation
- ✅ Permission revocation

#### Combined RBAC & PBAC
- ✅ Role and permission requirements
- ✅ Permission inheritance from roles
- ✅ Override mechanisms

#### Access Control Lists (ACL)
- ✅ Resource ownership validation
- ✅ Shared resource access
- ✅ Permission levels (read, write, delete)
- ✅ Access grant/revoke

### 3. Tenant Context Integration Tests (`tenant-integration.e2e-spec.ts`)

#### Tenant Isolation
- ✅ Data isolation between tenants
- ✅ Cross-tenant access prevention
- ✅ Tenant filter application
- ✅ Automatic tenant ID assignment
- ✅ Tenant ID manipulation prevention

#### Tenant Switching
- ✅ Multi-tenant user support
- ✅ Tenant switch authorization
- ✅ Context update after switch
- ✅ Token refresh on switch

#### Tenant Middleware
- ✅ JWT token tenant extraction
- ✅ Subdomain tenant detection
- ✅ Custom header tenant override
- ✅ Tenant source prioritization

#### Tenant Status
- ✅ Suspended tenant access denial
- ✅ Grace period handling
- ✅ Read-only mode during grace
- ✅ Usage metrics tracking

#### Tenant Administration
- ✅ Super admin capabilities
- ✅ Tenant provisioning workflow
- ✅ Tenant suspension/activation
- ✅ Data export/import

## Test Utilities

### AuthTestHelper (`helpers/auth-test.helper.ts`)
- Token generation and validation
- User authentication simulation
- Password hashing utilities
- Session management helpers
- MFA flow simulation
- Rate limiting testers

### PermissionTestHelper
- Permission checking
- Permission grant/revoke
- Role-based access testing
- Dynamic permission validation

### TenantTestHelper
- Tenant creation
- Tenant switching
- Isolation testing
- Multi-tenancy validation

## Running Tests

### Run all auth integration tests:
```bash
npm run test:auth
```

### Run specific test suite:
```bash
npm run test:integration -- test/auth/auth-integration.e2e-spec.ts
```

### Run with coverage:
```bash
npm run test:integration:cov
```

### Watch mode for development:
```bash
npm run test:integration:watch
```

## Test Database Setup

Tests use a separate test database that is automatically:
1. Created before tests run
2. Migrated with latest schema
3. Seeded with test data
4. Cleaned between test suites
5. Dropped after all tests complete

## Environment Variables

Create a `.env.test` file with:
```env
# Test Database
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_USER=postgres
TEST_DB_PASSWORD=postgres
TEST_DB_NAME=mes_test

# Test JWT
JWT_SECRET=test-jwt-secret
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# Test Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Test Services (mocked)
KEYCLOAK_URL=http://localhost:8080
OPENFGA_API_URL=http://localhost:8082
```

## Mocking Strategy

External services are mocked to ensure:
- Fast test execution
- Predictable test results
- No external dependencies
- Complete control over responses

### Mocked Services:
- **Keycloak**: Authentication, user management
- **OpenFGA**: Permission checks, relationship management
- **Redis**: Caching, session storage (can use real instance)
- **Email**: Notification sending

## Best Practices

1. **Test Isolation**: Each test is independent and can run in any order
2. **Clean State**: Database is cleaned between test suites
3. **Realistic Data**: Test data mirrors production scenarios
4. **Error Cases**: Both success and failure paths are tested
5. **Edge Cases**: Boundary conditions and edge cases covered
6. **Performance**: Tests complete within reasonable time (<30s per suite)

## Continuous Integration

Tests are automatically run in CI/CD pipeline:
1. On every pull request
2. Before merging to main branch
3. As part of deployment process
4. Nightly for comprehensive testing

## Coverage Goals

- **Line Coverage**: >80%
- **Branch Coverage**: >75%
- **Function Coverage**: >80%
- **Statement Coverage**: >80%

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check test database exists
   - Verify credentials in .env.test

2. **Token Validation Errors**
   - Check JWT_SECRET matches
   - Verify token expiration times
   - Ensure clock sync

3. **Timeout Errors**
   - Increase jest timeout in config
   - Check for async operations
   - Verify cleanup in afterEach

4. **Port Already in Use**
   - Kill existing processes
   - Use different test port
   - Check for hanging tests

## Contributing

When adding new auth features:
1. Write integration tests first (TDD)
2. Cover happy path and error cases
3. Add appropriate test utilities
4. Update this README
5. Ensure all tests pass
6. Maintain coverage levels