const baseConfig = require('./jest-all.config');

module.exports = {
  ...baseConfig,
  coverageThreshold: {},
  testRegex: '.*\\.e2e-spec\\.ts$',
};
