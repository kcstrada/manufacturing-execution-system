export const mockKeycloakProviders = [
  {
    provide: 'KEYCLOAK_INSTANCE',
    useValue: {},
  },
  {
    provide: 'KEYCLOAK_CONNECT_OPTIONS',
    useValue: {
      authServerUrl: 'http://localhost:8080/auth',
      realm: 'test',
      clientId: 'test-client',
      secret: 'test-secret',
    },
  },
  {
    provide: 'KEYCLOAK_LOGGER',
    useValue: {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  },
  {
    provide: 'KEYCLOAK_MULTITENANT_SERVICE',
    useValue: {
      getTenant: jest.fn(),
    },
  },
];

export const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

export const mockResourceGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

export const mockRolesGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};