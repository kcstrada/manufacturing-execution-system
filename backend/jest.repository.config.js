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
  ],
  coverageDirectory: './coverage-repositories',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};