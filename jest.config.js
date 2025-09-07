module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/'],
  coverageDirectory: './coverage',
  coverageReporters: [
    'json-summary',
    'text-summary',
    'cobertura',
    'lcov',
    'text',
  ],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/index.ts'],
  forceExit: true,
  maxWorkers: 3,
  setupFiles: ['./jest.setup.js'],
};
