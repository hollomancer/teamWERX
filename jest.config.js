module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "lib/**/*.js",
    "bin/**/*.js",
    "!lib/**/*.test.js",
    "!**/node_modules/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  testMatch: ["**/test/**/*.test.js", "**/__tests__/**/*.js"],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 25,
      lines: 12,
      statements: 12,
    },
  },
};
