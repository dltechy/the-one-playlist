const fs = require('fs');
const { pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = JSON.parse(fs.readFileSync('./tsconfig.json'));

module.exports = {
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/src/config/',
    '<rootDir>/src/helpers/',
    '<rootDir>/src/providers/',
    '<rootDir>/src/main.ts',
    '__tests__/',
    'constants/',
    'schemas/',
    'types/',
    '.dto.ts',
    '.module.ts',
  ],
  coverageReporters: ['html', 'text-summary'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: `<rootDir>/${compilerOptions.baseUrl}/`,
  }),
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*(\\.|\\.int-|\\.e2e-)spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
