/** @type {import('jest').Config} */
export default {
  projects: [
    {
      displayName: 'scripts',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/scripts/**/__tests__/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      collectCoverageFrom: [
        'scripts/**/*.ts',
        '!**/run-*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
      ],
    },
    {
      displayName: 'components',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      collectCoverageFrom: [
        'src/**/*.ts?(x)',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!src/main.tsx',
      ],
    },
  ],
};
