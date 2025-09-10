module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/repositories/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      isolatedModules: true,
    }],
  },
  collectCoverageFrom: [
    'src/repositories/**/*.ts',
    '!src/repositories/index.ts',
    '!src/repositories/**/*.module.ts',
    '!src/repositories/**/*.interface.ts',
  ],
  coverageDirectory: './coverage/repositories',
  testEnvironment: 'node',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  verbose: true,
  bail: false,
  detectOpenHandles: false,
  forceExit: true,
};