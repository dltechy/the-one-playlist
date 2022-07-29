const baseConfig = require('./jest-all.config');

module.exports = {
  ...baseConfig,
  coveragePathIgnorePatterns: [
    ...baseConfig.coveragePathIgnorePatterns,
    '<rootDir>/src/guards/',
    '.dao.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  testRegex: '.*\\.spec\\.ts$',
};
