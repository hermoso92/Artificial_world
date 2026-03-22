/**
 * Jest configuration for Guardrails Fitness Functions
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/scripts/guardrails/fitness-functions'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'scripts/guardrails/**/*.ts',
    '!scripts/guardrails/**/*.test.ts',
    '!scripts/guardrails/reports/**',
  ],
  coverageDirectory: 'scripts/guardrails/coverage',
  verbose: true,
  testTimeout: 60000, // 60s for repo-wide scans
};

