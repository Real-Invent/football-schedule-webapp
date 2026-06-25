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
      globals: {
        'ts-jest': {
          useESM: true,
          tsconfig: {
            types: ['jest', 'node'],
          },
        },
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
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      globals: {
        'ts-jest': {
          useESM: true,
          tsconfig: {
            module: 'es2020',
            target: 'es2020',
            jsx: 'react-jsx',
            types: ['jest', 'node', '@testing-library/jest-dom'],
          },
        },
      },
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
