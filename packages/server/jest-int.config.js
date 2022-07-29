const baseConfig = require('./jest-all.config');

module.exports = {
  ...baseConfig,
  coverageThreshold: {},
  testRegex: '.*\\.int-spec\\.ts$',
};
